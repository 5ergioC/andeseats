import React, { useEffect, useState } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import './LugarDetail.css';

// Componente para renderizar estrellas
const Stars = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(
        <span key={i} className="star filled">
          &#9733;
        </span>
      );
    } else {
      stars.push(
        <span key={i} className="star">
          &#9733;
        </span>
      );
    }
  }
  return <div className="rating">{stars}</div>;
};

const LugarDetail = (props) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Obtener el correo electrónico del usuario desde localStorage
    const email = localStorage.getItem('userEmail') || '';
    setUserEmail(email);
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const db = getFirestore();
        const restauranteRef = doc(db, 'Restaurante', props.ID);
        const comentariosCollection = collection(db, 'Comentario');
        const q = query(
          comentariosCollection,
          where('Restaurante', '==', restauranteRef)
        );
        const comentariosSnapshot = await getDocs(q);
        const comentariosList = comentariosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(comentariosList);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [props.ID]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      return;
    }
    try {
      const db = getFirestore();
      const restauranteRef = doc(db, 'Restaurante', props.ID);
      const comentariosCollection = collection(db, 'Comentario');
      await addDoc(comentariosCollection, {
        Contenido: newComment,
        Restaurante: restauranteRef,
        fecha: Timestamp.now(),
        email: userEmail
      });
      // Limpiar el campo de comentario
      setNewComment('');
      // Actualizar la lista de comentarios
      const q = query(
        comentariosCollection,
        where('Restaurante', '==', restauranteRef)
      );
      const comentariosSnapshot = await getDocs(q);
      const comentariosList = comentariosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(comentariosList);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="overlay">
      <div className="info-box">
        <h1>{props.Nombre}</h1>
        <Stars rating={props.Rating} />
        <h3 className="ubicacion">{props.Direccion}</h3>
        <p className="description">{props.Descripcion}</p>
        <p>
          <strong>Contacto:</strong> {props.Contacto}
        </p>
        <p>
          <strong>Precio:</strong> {props.Precio}
        </p>

        <div className="tags">
          {props.Domicilios && <span className="tag">Domicilios</span>}
          {props.MenuVegetariano && (
            <span className="tag">Menú Vegetariano</span>
          )}
          {props.Descuento && (
            <span className="tag">Descuentos con ticketeras</span>
          )}
        </div>


        {/* Sección de comentarios */}
        
          <h2>Comentarios</h2>
          {/* Formulario para agregar un nuevo comentario */}
          <form onSubmit={handleCommentSubmit} className="comentario-form">
            <textarea
              placeholder="Agregar un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
            <button className="add-comment-btn" type="submit">Enviar</button>
          </form>

          <div className="comentarios-section">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="comment">
                <p>{comment.Contenido}</p>
                <small>
                  {comment.email} -{' '}
                  {comment.fecha.toDate().toLocaleString()}
                </small>
              </div>
            ))
          ) : (
            <p>No hay comentarios.</p>
          )}


        </div>

        <button
          className="close-btn"
          onClick={() => props.SetActivePoint(null)}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default LugarDetail;
