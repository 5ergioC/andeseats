import React from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './AdminLugares.css';
import { app } from '../firebase-config';

const AdminLugares = () => {
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(firestore, `users/${user.uid}`));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          navigate('/'); // Redirige si no es admin
        }
      } else {
        navigate('/'); // Redirige si no estA� autenticado
      }
    });

    return () => unsubscribe();
  }, [auth, firestore, navigate]);

  if (!isAdmin) {
    return <div>Verificando permisos...</div>;
  }

  return (
    <div className="admin-panel">
      <h2>Panel de AdministraciA3n</h2>
      {/* Contenido del admin */}
    </div>
  );
};

export default AdminLugares;
