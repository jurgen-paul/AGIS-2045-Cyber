import { GoogleTaskItem, GoogleTaskList } from '../types';

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

export class GoogleTasksService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private tokenClient: any = null;
  private localTasks: GoogleTaskItem[] = [
    {
      id: 'task-sec-01',
      title: '[SECOPS] Complete 512-bit Kyber Key Lifecycle Attestation',
      notes: 'Hardware enclave key rotation cycle verified for eUICC Core #04. Target slot: 0x7FFF_8000_9000_PQE',
      status: 'completed',
      securityTier: 'Tier 1: Post-Quantum Enclave',
      completed: new Date(Date.now() - 3600000).toISOString(),
      updated: new Date().toISOString()
    },
    {
      id: 'task-sec-02',
      title: '[AWS PROD] Deploy AWS Nitro Enclave with KMS CMK Attestation',
      notes: 'Ensure vsock channel encryption and IAM role policy for KMS Decrypt with PCR0 condition.',
      status: 'needsAction',
      securityTier: 'Tier 4: AWS Production Deployment',
      due: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      updated: new Date().toISOString()
    },
    {
      id: 'task-sec-03',
      title: '[AUDIT] Investigate Epsilon Collapse Telemetry Anomaly #03',
      notes: 'Differential privacy budget consumed by aggregation query. Apply Laplace noise booster (ε=0.5).',
      status: 'needsAction',
      securityTier: 'Tier 3: Zero-Trust Defense',
      associatedAlertId: 'ANOMALY-HIST-03',
      due: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      updated: new Date().toISOString()
    },
    {
      id: 'task-sec-04',
      title: '[RADAR] Attest Operative Biometric Vector for Sean Cross',
      notes: 'Facial landmarks (68 points), voiceprint pitch, and geophone seismic gait attestation confirmed.',
      status: 'completed',
      securityTier: 'Tier 2: Biometric Attestation',
      completed: new Date(Date.now() - 7200000).toISOString(),
      updated: new Date().toISOString()
    }
  ];

  private localLists: GoogleTaskList[] = [
    { id: '@default', title: 'AGIS-2045 Cyber Operations', updated: new Date().toISOString() },
    { id: 'list-aws-prod', title: 'AWS Cloud Production Milestones', updated: new Date().toISOString() },
    { id: 'list-threat-triage', title: 'Zero-Trust Incident Triage', updated: new Date().toISOString() }
  ];

  private isConnected: boolean = false;
  private userEmail: string = 'westerveldjp@gmail.com';

  constructor() {
    const savedToken = localStorage.getItem('agis_gtasks_token');
    const savedExpiry = localStorage.getItem('agis_gtasks_expiry');
    if (savedToken && savedExpiry && Date.now() < parseInt(savedExpiry, 10)) {
      this.accessToken = savedToken;
      this.tokenExpiry = parseInt(savedExpiry, 10);
      this.isConnected = true;
    }
  }

  public initClient() {
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: '45167772995-aegis2045.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/tasks',
          callback: (response: any) => {
            if (response.access_token) {
              this.setToken(response.access_token, response.expires_in || 3600);
            }
          }
        });
      } catch (err) {
        console.warn('GSI token client initialization note:', err);
      }
    }
  }

  public requestTasksToken() {
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      this.initClient();
      if (this.tokenClient) {
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      }
    } else {
      // Simulate connected session in sandboxed prototype
      const mockToken = `ya29.a0AfH6SMA_${Math.random().toString(36).substring(2, 12)}`;
      this.setToken(mockToken, 3600);
    }
  }

  public isAuthenticated(): boolean {
    return this.isConnected || (this.accessToken !== null && Date.now() < this.tokenExpiry);
  }

  public getIsConnected(): boolean {
    return this.isAuthenticated();
  }

  public getUserEmail(): string {
    return this.userEmail;
  }

  public getCachedTasks(): GoogleTaskItem[] {
    return this.localTasks;
  }

  public setToken(token: string, expiresInSec: number = 3600) {
    this.accessToken = token;
    this.tokenExpiry = Date.now() + expiresInSec * 1000;
    this.isConnected = true;
    localStorage.setItem('agis_gtasks_token', token);
    localStorage.setItem('agis_gtasks_expiry', this.tokenExpiry.toString());
  }

  public disconnect() {
    this.accessToken = null;
    this.tokenExpiry = 0;
    this.isConnected = false;
    localStorage.removeItem('agis_gtasks_token');
    localStorage.removeItem('agis_gtasks_expiry');
  }

  public async fetchTaskLists(): Promise<GoogleTaskList[]> {
    if (!this.accessToken) {
      return this.localLists;
    }

    try {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Tasks API returned ${res.status}`);
      }

      const data = await res.json();
      return (data.items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        updated: item.updated
      }));
    } catch (err) {
      console.warn('Falling back to local task lists:', err);
      return this.localLists;
    }
  }

  public async fetchTasks(listId: string = '@default'): Promise<GoogleTaskItem[]> {
    if (!this.accessToken) {
      return this.localTasks;
    }

    try {
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showCompleted=true&showHidden=true`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Tasks API returned ${res.status}`);
      }

      const data = await res.json();
      const remote = (data.items || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        notes: item.notes,
        status: item.status,
        due: item.due,
        completed: item.completed,
        updated: item.updated,
        parent: item.parent
      }));
      this.localTasks = remote;
      return remote;
    } catch (err) {
      console.warn('Falling back to local tasks:', err);
      return this.localTasks;
    }
  }

  public async createTask(
    titleOrTask: string | Partial<GoogleTaskItem>, 
    notes?: string, 
    securityTier?: string, 
    listId: string = '@default'
  ): Promise<GoogleTaskItem> {
    let newTask: GoogleTaskItem;
    if (typeof titleOrTask === 'string') {
      newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: titleOrTask,
        notes: notes || '',
        status: 'needsAction',
        securityTier: securityTier || 'Tier 3: Zero-Trust Defense',
        updated: new Date().toISOString()
      };
    } else {
      newTask = {
        id: titleOrTask.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: titleOrTask.title || 'Security Operational Task',
        notes: titleOrTask.notes || notes || '',
        status: titleOrTask.status || 'needsAction',
        due: titleOrTask.due,
        securityTier: titleOrTask.securityTier || securityTier || 'Tier 3: Zero-Trust Defense',
        associatedAlertId: titleOrTask.associatedAlertId,
        updated: new Date().toISOString()
      };
    }

    if (this.accessToken) {
      try {
        const body: any = {
          title: newTask.title,
          notes: newTask.notes,
          status: newTask.status
        };
        if (newTask.due) {
          body.due = new Date(newTask.due).toISOString();
        }

        const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          const created = await res.json();
          newTask.id = created.id;
        }
      } catch (err) {
        console.warn('Failed to sync to Google Tasks directly, stored in state:', err);
      }
    }

    this.localTasks = [newTask, ...this.localTasks];
    return newTask;
  }

  public async toggleTask(taskId: string, listId: string = '@default'): Promise<GoogleTaskItem | null> {
    const task = this.localTasks.find(t => t.id === taskId);
    if (!task) return null;

    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    task.status = newStatus;
    task.completed = newStatus === 'completed' ? new Date().toISOString() : undefined;
    task.updated = new Date().toISOString();

    if (this.accessToken) {
      try {
        await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: newStatus,
            completed: task.completed
          })
        });
      } catch (err) {
        console.warn('Failed to update Google Tasks remote:', err);
      }
    }

    return task;
  }

  public async toggleTaskStatus(taskId: string, listId: string = '@default'): Promise<GoogleTaskItem | null> {
    return this.toggleTask(taskId, listId);
  }

  public async deleteTask(taskId: string, listId: string = '@default'): Promise<boolean> {
    this.localTasks = this.localTasks.filter(t => t.id !== taskId);

    if (this.accessToken) {
      try {
        await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        });
      } catch (err) {
        console.warn('Failed to delete Google Tasks remote:', err);
      }
    }

    return true;
  }

  public async pushProductionChecklist(): Promise<void> {
    const checklist = [
      { title: '[AWS] Enable AWS Nitro Enclaves vsock channel on m6i.xlarge', tier: 'Tier 4: AWS Production Deployment' },
      { title: '[CRYPTO] Verify NIST FIPS 203 Kyber-1024 dual isolation memory boundary', tier: 'Tier 1: Post-Quantum Enclave' },
      { title: '[SECURITY] Enforce AWS WAFv2 Layer-7 prompt injection rule group', tier: 'Tier 3: Zero-Trust Defense' },
      { title: '[PRIVACY] Validate Laplace differential privacy budget threshold (ε = 0.5)', tier: 'Tier 3: Zero-Trust Defense' },
      { title: '[BIOMETRIC] Attest multi-modal FIDO2 passkey and seismic sensor nodes', tier: 'Tier 2: Biometric Attestation' }
    ];

    for (const item of checklist) {
      const exists = this.localTasks.some(t => t.title === item.title);
      if (!exists) {
        await this.createTask(item.title, 'Mandatory verification requirement for AEGIS-2045 production deployment.', item.tier);
      }
    }
  }
}

export const googleTasksService = new GoogleTasksService();
