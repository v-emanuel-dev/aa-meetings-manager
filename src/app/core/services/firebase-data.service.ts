import { Injectable, computed, signal } from '@angular/core';
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import {
  Firestore,
  doc,
  getDoc,
  initializeFirestore,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { AppData, SyncStatus } from '../models/app-data.model';

interface StoredCloudData extends AppData {
  updatedAt?: unknown;
}

@Injectable({ providedIn: 'root' })
export class FirebaseDataService {
  private readonly status = signal<SyncStatus>(this.hasFirebaseConfig(environment.firebase) ? 'connecting' : 'disabled');
  private app?: FirebaseApp;
  private firestore?: Firestore;

  readonly syncStatus = computed(() => this.status());
  readonly enabled = computed(() => this.status() !== 'disabled');

  constructor() {
    if (!this.hasFirebaseConfig(environment.firebase)) {
      return;
    }

    try {
      this.app = initializeApp(environment.firebase);
      this.firestore = initializeFirestore(this.app, { ignoreUndefinedProperties: true });
      this.status.set('connecting');
    } catch (error) {
      console.error('Firebase initialization failed', error);
      this.status.set('error');
    }
  }

  async loadData(): Promise<AppData | null> {
    if (!this.firestore) {
      return null;
    }

    try {
      this.status.set('connecting');
      const snapshot = await getDoc(doc(this.firestore, environment.firebaseDocumentPath));
      if (!snapshot.exists()) {
        this.status.set('synced');
        return null;
      }

      const data = snapshot.data() as StoredCloudData;
      this.status.set('synced');
      return {
        meetings: Array.isArray(data.meetings) ? data.meetings : [],
        reflections: Array.isArray(data.reflections) ? data.reflections : [],
        theme: data.theme === 'dark' ? 'dark' : 'light'
      };
    } catch (error) {
      console.error('Firebase load failed', error);
      this.status.set('error');
      return null;
    }
  }

  async saveData(data: AppData): Promise<void> {
    if (!this.firestore) {
      return;
    }

    try {
      this.status.set('saving');
      await setDoc(
        doc(this.firestore, environment.firebaseDocumentPath),
        {
          ...JSON.parse(JSON.stringify(data)),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      this.status.set('synced');
    } catch (error) {
      console.error('Firebase save failed', error);
      this.status.set('error');
    }
  }

  private hasFirebaseConfig(config: FirebaseOptions): boolean {
    return Boolean(config.apiKey && config.projectId && config.appId);
  }
}
