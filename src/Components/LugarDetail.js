import React, { useEffect, useMemo, useState } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  addDoc,
  Timestamp,
  getDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import './LugarDetail.css';

const Stars = ({ rating }) => {
  const rounded = Math.round(rating ?? 0);
  return (
    <div className="rating">
      {[1, 2, 3, 4, 5].map((value) => (
        <span
          key={value}
          className={`star ${value <= rounded ? 'filled' : ''}`}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
};

const RatingSelector = ({
  value,
  hoverValue,
  onSelect,
  onHover,
  disabled
}) => {
  const displayValue = hoverValue ?? value ?? 0;
  return (
    <div
      className="rating-selector"
      role="group"
      aria-label="Seleccionar calificacion"
    >
      {[1, 2, 3, 4, 5].map((starValue) => {
        const isActive = displayValue >= starValue;
        return (
          <button
            key={starValue}
            type="button"
            className={`rating-selector__star ${isActive ? 'is-active' : ''}`}
            onClick={() => onSelect(starValue)}
            onMouseEnter={() => onHover(starValue)}
            onMouseLeave={() => onHover(null)}
            disabled={disabled}
            aria-label={`Calificar con ${starValue} ${
              starValue === 1 ? 'estrella' : 'estrellas'
            }`}
          >
            &#9733;
          </button>
        );
      })}
    </div>
  );
};

const LugarDetail = (props) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRating, setUserRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(null);
  const [displayRating, setDisplayRating] = useState(
    Number(props.Rating ?? 0)
  );
  const [ratingCount, setRatingCount] = useState(
    Number(props.RatingCount ?? 0)
  );
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    setUserEmail(email);
  }, []);

  useEffect(() => {
    setDisplayRating(Number(props.Rating ?? 0));
    setRatingCount(Number(props.RatingCount ?? 0));
    setUserRating(null);
    setHoverRating(null);
  }, [props.ID, props.Rating, props.RatingCount]);

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
        const comentariosList = comentariosSnapshot.docs.map((commentDoc) => ({
          id: commentDoc.id,
          ...commentDoc.data()
        }));
        setComments(comentariosList);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [props.ID]);

  useEffect(() => {
    const fetchUserRating = async () => {
      if (!userEmail || !props.ID) {
        setUserRating(null);
        return;
      }

      try {
        const db = getFirestore();
        const ratingDocRef = doc(
          db,
          'Restaurante',
          props.ID,
          'ratings',
          userEmail
        );
        const ratingSnapshot = await getDoc(ratingDocRef);
        if (ratingSnapshot.exists()) {
          const value = Number(ratingSnapshot.data()?.valor ?? 0);
          setUserRating(Number.isFinite(value) ? value : null);
        } else {
          setUserRating(null);
        }
      } catch (error) {
        console.error('Error fetching rating:', error);
      }
    };

    fetchUserRating();
  }, [props.ID, userEmail]);

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
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

      setNewComment('');
      setCommentError('');

      const q = query(
        comentariosCollection,
        where('Restaurante', '==', restauranteRef)
      );
      const comentariosSnapshot = await getDocs(q);
      const comentariosList = comentariosSnapshot.docs.map((commentDoc) => ({
        id: commentDoc.id,
        ...commentDoc.data()
      }));
      setComments(comentariosList);
    } catch (error) {
      console.error('Error adding comment:', error);
      setCommentError('No se pudo guardar tu comentario. Intenta nuevamente.');
    }
  };

  const handleDeleteComment = async (commentId, commentAuthor) => {
    if (!userEmail) {
      setCommentError('Debes iniciar sesion para administrar comentarios.');
      return;
    }

    const normalizedUser = userEmail.trim().toLowerCase();
    const normalizedAuthor = (commentAuthor ?? '').trim().toLowerCase();
    if (!commentId || normalizedUser !== normalizedAuthor) {
      setCommentError('Solo puedes borrar tus propios comentarios.');
      return;
    }

    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'Comentario', commentId));
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setCommentError('');
    } catch (error) {
      console.error('Error deleting comment:', error);
      setCommentError('No se pudo borrar el comentario. Intenta nuevamente.');
    }
  };

  const handleRatingSelect = async (value) => {
    if (!props.ID || isSubmittingRating) {
      return;
    }

    if (!userEmail) {
      setRatingError('Debes iniciar sesion para calificar.');
      return;
    }

    setIsSubmittingRating(true);
    setRatingError('');

    const db = getFirestore();
    const restaurantRef = doc(db, 'Restaurante', props.ID);
    const ratingDocRef = doc(restaurantRef, 'ratings', userEmail);

    let updatedAverage = displayRating;
    let updatedCount = ratingCount;

    try {
      await runTransaction(db, async (transaction) => {
        const restaurantSnapshot = await transaction.get(restaurantRef);
        if (!restaurantSnapshot.exists()) {
          throw new Error('Restaurante no encontrado');
        }

        const data = restaurantSnapshot.data() ?? {};
        let total = Number(data.ratingTotal ?? 0);
        let count = Number(data.ratingCount ?? 0);
        if (!Number.isFinite(total)) {
          total = 0;
        }
        if (!Number.isFinite(count)) {
          count = 0;
        }

        const ratingSnapshot = await transaction.get(ratingDocRef);
        if (ratingSnapshot.exists()) {
          const prevValue = Number(ratingSnapshot.data()?.valor ?? 0);
          total -= prevValue;
        } else {
          count += 1;
        }

        total += value;
        const average = count > 0 ? total / count : 0;

        transaction.set(ratingDocRef, {
          valor: value,
          email: userEmail,
          updatedAt: serverTimestamp()
        });

        transaction.update(restaurantRef, {
          ratingTotal: total,
          ratingCount: count,
          rating: average
        });

        updatedAverage = average;
        updatedCount = count;
      });

      setUserRating(value);
      setDisplayRating(updatedAverage);
      setRatingCount(updatedCount);

      if (typeof props.onRatingUpdated === 'function') {
        props.onRatingUpdated(props.ID, updatedAverage, updatedCount);
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      setRatingError('No se pudo guardar tu calificacion. Intenta de nuevo.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const formattedAverage = useMemo(
    () => displayRating.toFixed(1),
    [displayRating]
  );

  return (
    <div className="overlay">
      <div className="info-box">
        <h1>{props.Nombre}</h1>
        <div className="rating-summary">
          <Stars rating={displayRating} />
          <div className="rating-summary__meta">
            <span className="rating-summary__value">{formattedAverage}</span>
            <span className="rating-summary__count">
              ({ratingCount}{' '}
              {ratingCount === 1 ? 'calificacion' : 'calificaciones'})
            </span>
          </div>
        </div>
        <div className="rating-section">
          <p className="rating-section__label">
            Tu calificacion:{' '}
            <span className="rating-section__current">
              {userRating ? `${userRating}/5` : 'sin evaluar'}
            </span>
          </p>
          <RatingSelector
            value={userRating}
            hoverValue={hoverRating}
            onSelect={handleRatingSelect}
            onHover={setHoverRating}
            disabled={isSubmittingRating}
          />
          {ratingError && <p className="error">{ratingError}</p>}
        </div>
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
            <span className="tag">Menu Vegetariano</span>
          )}
          {props.Descuento && (
            <span className="tag">Descuentos con ticketeras</span>
          )}
        </div>

        <h2>Comentarios</h2>
        <form onSubmit={handleCommentSubmit} className="comentario-form">
          <textarea
            placeholder="Agregar un comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
          />
          <button className="add-comment-btn" type="submit">
            Enviar
          </button>
        </form>

        <div className="comentarios-section">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="comment">
                <p>{comment.Contenido}</p>
                <small>
                  {comment.email}
                  {comment.fecha?.toDate
                    ? ` - ${comment.fecha.toDate().toLocaleString()}`
                    : ''}
                </small>
                {userEmail &&
                  userEmail.trim().toLowerCase() ===
                    (comment.email ?? '').trim().toLowerCase() && (
                    <button
                      type="button"
                      className="comment-delete"
                      onClick={() =>
                        handleDeleteComment(comment.id, comment.email)
                      }
                    >
                      Eliminar
                    </button>
                  )}
              </div>
            ))
          ) : (
            <p>No hay comentarios.</p>
          )}
          {commentError && <p className="error">{commentError}</p>}
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
