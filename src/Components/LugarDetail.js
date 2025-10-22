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
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../firebase-config';
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
  const [userUid, setUserUid] = useState('');
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
    if (email) {
      setUserEmail(email);
    }
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email ?? email ?? '');
        setUserUid(user.uid ?? '');
      } else {
        setUserUid('');
        if (!email) {
          setUserEmail('');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setDisplayRating(Number(props.Rating ?? 0));
    setRatingCount(Number(props.RatingCount ?? 0));
  }, [props.Rating, props.RatingCount]);

  useEffect(() => {
    setUserRating(null);
    setHoverRating(null);
  }, [props.ID]);

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
    if (!userEmail || !userUid) {
      setCommentError('Debes iniciar sesion para comentar.');
      return;
    }

    try {
      const db = getFirestore();
      const restauranteRef = doc(db, 'Restaurante', props.ID);
      const comentariosCollection = collection(db, 'Comentario');

      const existingSnapshot = await getDocs(
        query(
          comentariosCollection,
          where('Restaurante', '==', restauranteRef),
          where('email', '==', userEmail)
        )
      );

      const payload = {
        Contenido: newComment,
        Restaurante: restauranteRef,
        fecha: Timestamp.now(),
        email: userEmail,
        uid: userUid
      };

      if (!existingSnapshot.empty) {
        const existingComment = existingSnapshot.docs[0];
        await updateDoc(doc(db, 'Comentario', existingComment.id), payload);
      } else {
        await addDoc(comentariosCollection, payload);
      }

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

  const handleDeleteComment = async (commentId, commentAuthorEmail, commentAuthorUid) => {
    if (!userEmail || !userUid) {
      setCommentError('Debes iniciar sesion para administrar comentarios.');
      return;
    }

    const normalizedUser = userEmail.trim().toLowerCase();
    const normalizedAuthor = (commentAuthorEmail ?? '').trim().toLowerCase();
    const isOwnerByEmail = normalizedUser && normalizedAuthor && normalizedUser === normalizedAuthor;
    const isOwnerByUid =
      userUid && commentAuthorUid && userUid === commentAuthorUid;

    if (!commentId || (!isOwnerByEmail && !isOwnerByUid)) {
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
    const ratingDocId = userEmail;
    const ratingDocRef = doc(restaurantRef, 'ratings', ratingDocId);

    try {
      await setDoc(
        ratingDocRef,
        {
          valor: value,
          email: userEmail,
          uid: userUid,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      const ratingsSnapshot = await getDocs(collection(restaurantRef, 'ratings'));
      let total = 0;
      let count = 0;
      ratingsSnapshot.forEach((ratingSnap) => {
        const ratingVal = Number(ratingSnap.data()?.valor);
        if (Number.isFinite(ratingVal)) {
          total += ratingVal;
          count += 1;
        }
      });
      const average = count > 0 ? total / count : 0;

      setUserRating(value);
      setDisplayRating(average);
      setRatingCount(count);

      if (typeof props.onRatingUpdated === 'function') {
        props.onRatingUpdated(props.ID, average, count);
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

  const contactText =
    typeof props.Contacto === 'string' ? props.Contacto.trim() : props.Contacto ?? '';
  const hasContact = Boolean(
    contactText && !/^no\s+(definido|aplica|disponible)$/i.test(contactText)
  );
  const tiposComida =
    Array.isArray(props.TipoComida) && props.TipoComida.length > 0
      ? props.TipoComida.filter(Boolean)
      : [];

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
        {hasContact && (
          <p>
            <strong>Contacto:</strong> {contactText}
          </p>
        )}
        <p>
          <strong>Precio:</strong> {props.Precio}
        </p>

        <div className="tags">
          {props.Domicilios && <span className="tag">Domicilios</span>}
          {props.MenuVegetariano && (
            <span className="tag">Menu Vegetariano</span>
          )}
          {props.Descuento && (
            <span className="tag">Descuentos con tiquetera</span>
          )}
          {tiposComida.map((tipo) => (
            <span key={tipo} className="tag">
              {tipo}
            </span>
          ))}
        </div>

        <h2>Comentarios</h2>
        <p className="comment-hint">
          Puedes agregar o actualizar tu comentario. Solo el más reciente se guardará.
        </p>
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
                {(userUid && comment.uid && userUid === comment.uid) ||
                (userEmail &&
                  userEmail.trim().toLowerCase() ===
                    (comment.email ?? '').trim().toLowerCase()) ? (
                  <button
                    type="button"
                    className="comment-delete"
                    onClick={() =>
                      handleDeleteComment(comment.id, comment.email, comment.uid)
                    }
                  >
                    Eliminar
                  </button>
                ) : null}
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
