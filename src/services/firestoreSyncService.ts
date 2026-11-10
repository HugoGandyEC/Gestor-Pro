import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Client, Supplier, ServiceOrder, CompanyAppointment } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return true;
  } catch (err: any) {
    if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
      console.warn('Firestore em modo offline ou aguardando conexão.');
      return false;
    }
    // Document not found is fine, means connection succeeded
    return true;
  }
}

export interface SyncCallbacks {
  onProductsSync: (products: Product[]) => void;
  onClientsSync: (clients: Client[]) => void;
  onSuppliersSync: (suppliers: Supplier[]) => void;
  onOrdersSync: (orders: ServiceOrder[]) => void;
  onAppointmentsSync: (appointments: CompanyAppointment[]) => void;
}

// Real-time synchronization listeners
export function subscribeToCloudSync(callbacks: SyncCallbacks): () => void {
  const unsubscribes: (() => void)[] = [];

  try {
    // 1. Produtos em tempo real
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudProducts: Product[] = [];
        snapshot.forEach(docSnap => {
          cloudProducts.push(docSnap.data() as Product);
        });
        callbacks.onProductsSync(cloudProducts);
      }
    }, (error) => {
      console.warn('Erro ao sincronizar produtos da nuvem:', error);
    });
    unsubscribes.push(unsubProducts);

    // 2. Clientes em tempo real
    const unsubClients = onSnapshot(collection(db, 'clients'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudClients: Client[] = [];
        snapshot.forEach(docSnap => {
          cloudClients.push(docSnap.data() as Client);
        });
        callbacks.onClientsSync(cloudClients);
      }
    }, (error) => {
      console.warn('Erro ao sincronizar clientes da nuvem:', error);
    });
    unsubscribes.push(unsubClients);

    // 3. Fornecedores em tempo real
    const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudSuppliers: Supplier[] = [];
        snapshot.forEach(docSnap => {
          cloudSuppliers.push(docSnap.data() as Supplier);
        });
        callbacks.onSuppliersSync(cloudSuppliers);
      }
    }, (error) => {
      console.warn('Erro ao sincronizar fornecedores da nuvem:', error);
    });
    unsubscribes.push(unsubSuppliers);

    // 4. Ordens de Serviço em tempo real
    const unsubOrders = onSnapshot(collection(db, 'serviceOrders'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudOrders: ServiceOrder[] = [];
        snapshot.forEach(docSnap => {
          cloudOrders.push(docSnap.data() as ServiceOrder);
        });
        callbacks.onOrdersSync(cloudOrders);
      }
    }, (error) => {
      console.warn('Erro ao sincronizar ordens de serviço da nuvem:', error);
    });
    unsubscribes.push(unsubOrders);

    // 5. Agendamentos em tempo real
    const unsubAppointments = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudAppointments: CompanyAppointment[] = [];
        snapshot.forEach(docSnap => {
          cloudAppointments.push(docSnap.data() as CompanyAppointment);
        });
        callbacks.onAppointmentsSync(cloudAppointments);
      }
    }, (error) => {
      console.warn('Erro ao sincronizar agendamentos da nuvem:', error);
    });
    unsubscribes.push(unsubAppointments);

  } catch (err) {
    console.warn('Falha ao inicializar observadores do Firestore:', err);
  }

  return () => {
    unsubscribes.forEach(unsub => {
      try { unsub(); } catch {}
    });
  };
}

// Single item persistence helpers
export async function syncProductToCloud(product: Product): Promise<void> {
  try {
    await setDoc(doc(db, 'products', product.id), product);
  } catch (err) {
    console.warn('Erro ao salvar produto no Firestore:', err);
  }
}

export async function deleteProductFromCloud(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    console.warn('Erro ao remover produto do Firestore:', err);
  }
}

export async function syncClientToCloud(client: Client): Promise<void> {
  try {
    await setDoc(doc(db, 'clients', client.id), client);
  } catch (err) {
    console.warn('Erro ao salvar cliente no Firestore:', err);
  }
}

export async function deleteClientFromCloud(clientId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'clients', clientId));
  } catch (err) {
    console.warn('Erro ao remover cliente do Firestore:', err);
  }
}

export async function syncSupplierToCloud(supplier: Supplier): Promise<void> {
  try {
    await setDoc(doc(db, 'suppliers', supplier.id), supplier);
  } catch (err) {
    console.warn('Erro ao salvar fornecedor no Firestore:', err);
  }
}

export async function deleteSupplierFromCloud(supplierId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'suppliers', supplierId));
  } catch (err) {
    console.warn('Erro ao remover fornecedor do Firestore:', err);
  }
}

export async function syncOrderToCloud(order: ServiceOrder): Promise<void> {
  try {
    await setDoc(doc(db, 'serviceOrders', order.id), order);
  } catch (err) {
    console.warn('Erro ao salvar ordem no Firestore:', err);
  }
}

export async function deleteOrderFromCloud(orderId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'serviceOrders', orderId));
  } catch (err) {
    console.warn('Erro ao remover ordem do Firestore:', err);
  }
}

export async function syncAppointmentToCloud(appointment: CompanyAppointment): Promise<void> {
  try {
    await setDoc(doc(db, 'appointments', appointment.id), appointment);
  } catch (err) {
    console.warn('Erro ao salvar agendamento no Firestore:', err);
  }
}

export async function deleteAppointmentFromCloud(appointmentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'appointments', appointmentId));
  } catch (err) {
    console.warn('Erro ao remover agendamento do Firestore:', err);
  }
}

// Initial bootstrap: if cloud is empty, upload current initial/local data
export async function bootstrapCloudDatabase(initialData: {
  products: Product[];
  clients: Client[];
  suppliers: Supplier[];
  serviceOrders: ServiceOrder[];
  appointments: CompanyAppointment[];
}): Promise<void> {
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (productsSnap.empty && initialData.products.length > 0) {
      console.log('Populando Firestore com produtos iniciais...');
      const batch = writeBatch(db);
      initialData.products.forEach(p => {
        batch.set(doc(db, 'products', p.id), p);
      });
      initialData.clients.forEach(c => {
        batch.set(doc(db, 'clients', c.id), c);
      });
      initialData.suppliers.forEach(s => {
        batch.set(doc(db, 'suppliers', s.id), s);
      });
      initialData.serviceOrders.forEach(o => {
        batch.set(doc(db, 'serviceOrders', o.id), o);
      });
      initialData.appointments.forEach(a => {
        batch.set(doc(db, 'appointments', a.id), a);
      });
      await batch.commit();
      console.log('Bootstrap do Firestore concluído com sucesso!');
    }
  } catch (err) {
    console.warn('Aviso no bootstrap do Firestore:', err);
  }
}
