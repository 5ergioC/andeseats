import React from 'react';
import './ClusterModal.css';

const ClusterModal = ({ data, onClose, onSelect }) => {
  if (!data) {
    return null;
  }

  const { restaurants, total, truncated } = data;

  return (
    <div className="cluster-overlay" role="dialog" aria-modal="true">
      <div className="cluster-panel">
        <button
          type="button"
          aria-label="Cerrar"
          className="cluster-panel__close"
          onClick={onClose}
        >
          ×
        </button>
        <div className="cluster-panel__grip" aria-hidden="true" />

        <div className="cluster-panel__header">
          <h2 className="cluster-panel__title">
            Restaurantes cercanos ({restaurants.length}
            {total ? ` de ${total}` : ''})
          </h2>
          <p className="cluster-panel__subtitle">
            Selecciona uno para ver el detalle en el mapa.
          </p>
        </div>

        <div className="cluster-panel__body">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id || `${restaurant.nombre}-${restaurant.coordinates.lng}`}
              className="cluster-panel__item"
            >
              <div className="cluster-panel__info">
                <div className="cluster-panel__name">{restaurant.nombre}</div>
                <div className="cluster-panel__detail">{restaurant.direccion}</div>
                {restaurant.precio && (
                  <div className="cluster-panel__detail">Precio: {restaurant.precio}</div>
                )}
                {restaurant.domicilios && (
                  <div className="cluster-panel__detail">Ofrece domicilios</div>
                )}
                {restaurant.menuVegetariano && (
                  <div className="cluster-panel__detail">Opciones vegetarianas</div>
                )}
              </div>
              <button
                type="button"
                className="cluster-panel__action"
                onClick={() => onSelect(restaurant)}
              >
                Ver
              </button>
            </div>
          ))}
        </div>

        {truncated && (
          <div className="cluster-panel__footer">
            Solo mostramos los primeros {restaurants.length} resultados de este cluster.
            Acércate más para ver el resto.
          </div>
        )}
      </div>
    </div>
  );
};

export default ClusterModal;
