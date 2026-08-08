// services/projectService.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  type QueryConstraint,
} from "firebase/firestore";
import { getFirebaseFirestore, firebaseEnabled } from "@/config/firebase";
import { mockProjects } from "@/mock/projects";
import type { Project } from "@/types";
import { delay } from "@/utils";

const STORE_KEY = "devflow.projects";
const COLLECTION_NAME = "jira_projects";

// Convert Firestore timestamp to Date
const convertTimestamps = (data: Record<string, unknown>): Record<string, unknown> => {
  const result = { ...data };
  for (const key in result) {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate().toISOString();
    }
  }
  return result;
};

// Local storage fallback for demo mode
function readLocal(): Project[] {
  if (typeof window === "undefined") return mockProjects;
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return mockProjects;
  try {
    return JSON.parse(raw) as Project[];
  } catch {
    return mockProjects;
  }
}

function writeLocal(projects: Project[]) {
  if (typeof window !== "undefined") localStorage.setItem(STORE_KEY, JSON.stringify(projects));
}

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const db = getFirebaseFirestore();

    // Fallback to local storage if Firebase is not configured
    if (!db || !firebaseEnabled) {
      await delay(400);
      return readLocal();
    }

    try {
      const projectsRef = collection(db, COLLECTION_NAME);
      const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
      const q = query(projectsRef, ...constraints);
      const snapshot = await getDocs(q);

      const projects: Project[] = [];
      snapshot.forEach((doc) => {
        const data = convertTimestamps(doc.data());
        projects.push({
          id: doc.id,
          ...data,
        } as Project);
      });

      return projects;
    } catch (error) {
      console.error("Error fetching projects:", error);
      // Fallback to local storage on error
      return readLocal();
    }
  },

  async getProject(id: string): Promise<Project | undefined> {
    const db = getFirebaseFirestore();

    if (!db || !firebaseEnabled) {
      await delay(200);
      return readLocal().find((p) => p.id === id);
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = convertTimestamps(docSnap.data());
        return {
          id: docSnap.id,
          ...data,
        } as Project;
      }
      return undefined;
    } catch (error) {
      console.error("Error fetching project:", error);
      return readLocal().find((p) => p.id === id);
    }
  },

  async createProject(
    input: Omit<Project, "id" | "tasks" | "completed" | "aiAssisted" | "status">,
  ): Promise<Project> {
    const db = getFirebaseFirestore();

    const newProject: Omit<Project, "id"> = {
      ...input,
      status: "Active",
      tasks: 0,
      completed: 0,
      aiAssisted: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Fallback to local storage if Firebase is not configured
    if (!db || !firebaseEnabled) {
      await delay(800);
      const project: Project = {
        ...newProject,
        id: `p-${Date.now()}`,
      };
      writeLocal([...readLocal(), project]);
      return project;
    }

    try {
      const projectsRef = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(projectsRef, {
        ...newProject,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return {
        ...newProject,
        id: docRef.id,
      };
    } catch (error) {
      console.error("Error creating project:", error);
      // Fallback to local storage on error
      const project: Project = {
        ...newProject,
        id: `p-${Date.now()}`,
      };
      writeLocal([...readLocal(), project]);
      return project;
    }
  },

  async updateProject(id: string, patch: Partial<Project>): Promise<void> {
    const db = getFirebaseFirestore();

    if (!db || !firebaseEnabled) {
      await delay(400);
      writeLocal(
        readLocal().map((p) =>
          p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
        ),
      );
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...patch,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating project:", error);
      // Fallback to local storage on error
      writeLocal(
        readLocal().map((p) =>
          p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
        ),
      );
    }
  },

  async deleteProject(id: string): Promise<void> {
    const db = getFirebaseFirestore();

    if (!db || !firebaseEnabled) {
      await delay(400);
      writeLocal(readLocal().filter((p) => p.id !== id));
      return;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting project:", error);
      // Fallback to local storage on error
      writeLocal(readLocal().filter((p) => p.id !== id));
    }
  },

  // Sync local projects to Firebase (useful for migration)
  async syncToFirebase(): Promise<void> {
    const db = getFirebaseFirestore();
    if (!db || !firebaseEnabled) {
      console.warn("Firebase is not configured. Cannot sync.");
      return;
    }

    const localProjects = readLocal();
    const projectsRef = collection(db, COLLECTION_NAME);

    for (const project of localProjects) {
      try {
        const { id, ...projectData } = project;
        await addDoc(projectsRef, {
          ...projectData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } catch (error) {
        console.error(`Error syncing project ${project.id}:`, error);
      }
    }
  },
};
