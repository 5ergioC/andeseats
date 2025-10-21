import React from 'react';

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalStyle = {
  width: 'min(90vw, 480px)',
  maxHeight: '80vh',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 18px 50px rgba(31, 41, 55, 0.35)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid #f3f4f6'
};

const bodyStyle = {
  padding: '12px 20px 20px',
  overflowY: 'auto'
};

const footerStyle = {
  padding: '12px 20px',
  borderTop: '1px solid #f3f4f6',
  fontSize: '0.85rem',
  color: '#6b7280'
};

const itemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '12px',
  padding: '12px 0',
  borderBottom: '1px solid #f3f4f6'
};

const infoStyle = {
  flex: 1,
  minWidth: 0
};

const nameStyle = {
  fontWeight: 600,
  fontSize: '1rem',
  color: '#111827',
  marginBottom: '4px'
};

const detailStyle = {
  fontSize: '0.88rem',
  color: '#4b5563',
  marginBottom: '2px'
};

const buttonStyle = {
  border: 'none',
  backgroundColor: '#f97316',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '8px 12px',
  cursor: 'pointer',
  fontWeight: 600,
  whiteSpace: 'nowrap'
};

const closeButtonStyle = {
  border: 'none',
  background: 'transparent',
  fontSize: '1.6rem',
  lineHeight: 1,
  cursor: 'pointer',
  color: '#4b5563',
  padding: 0,
  margin: 0
};

const ClusterModal = ({ data, onClose, onSelect }) => {
  if (!data) {
    return null;
  }

  const { restaurants, total, truncated } = data;

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true">
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              Restaurantes cercanos ({restaurants.length}
              {total ? ` de ${total}` : ''})
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#6b7280' }}>
              Selecciona uno para ver el detalle en el mapa.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            style={closeButtonStyle}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div style={bodyStyle}>
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id || `${restaurant.nombre}-${restaurant.coordinates.lng}`}
              style={itemStyle}
            >
              <div style={infoStyle}>
                <div style={nameStyle}>{restaurant.nombre}</div>
                <div style={detailStyle}>{restaurant.direccion}</div>
                {restaurant.precio && (
                  <div style={detailStyle}>Precio: {restaurant.precio}</div>
                )}
                {restaurant.domicilios && (
                  <div style={detailStyle}>Ofrece domicilios</div>
                )}
                {restaurant.menuVegetariano && (
                  <div style={detailStyle}>Opciones vegetarianas</div>
                )}
              </div>
              <button
                type="button"
                style={buttonStyle}
                onClick={() => onSelect(restaurant)}
              >
                Ver
              </button>
            </div>
          ))}
        </div>

        {truncated && (
          <div style={footerStyle}>
            Solo mostramos los primeros {restaurants.length} resultados de este cluster.
            Acércate más para ver el resto.
          </div>
        )}
      </div>
    </div>
  );
};

export default ClusterModal;
