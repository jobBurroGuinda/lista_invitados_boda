/**
 * @fileoverview Aplicación pública de lista de invitados confirmados con escaner QR.
 * @author Job Adolfo Salinas Hernández
 */
import React, { useEffect, useRef, useState } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { BrowserMultiFormatReader } from '@zxing/browser';
import './App.css';

/** Nombre de la colección de Firestore que almacena las invitaciones. @type {string} */
const COLLECTION = 'invitaciones';
/** Expresión regular para validar un UUID v4. @type {RegExp} */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Expresión regular para extraer el UUID de una URL completa de invitación. @type {RegExp} */
const INVITE_URL_REGEX = /^https:\/\/missael-y-tiatira\.web\.app\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/invitacion$/i;

/**
 * Extrae el UUID de un texto escaneado, ya sea un UUID puro o una URL de invitación completa.
 *
 * @param {string} text - Texto leído del código QR.
 * @returns {string|null} UUID extraído, o null si el texto no es válido.
 */
function extractUUID(text) {
  if (UUID_REGEX.test(text)) return text;
  const match = text.match(INVITE_URL_REGEX);
  if (match) return match[1];
  return null;
}

/**
 * Alerta modal que muestra el resultado de la verificación de un código QR.
 *
 * @component
 * @param {Object} props
 * @param {'success'|'warning'|'error'|'info'} props.type - Tipo de alerta.
 * @param {string} props.title - Título de la alerta.
 * @param {string|JSX.Element} props.message - Mensaje descriptivo.
 * @param {Function} props.onClose - Callback al cerrar la alerta.
 * @returns {JSX.Element}
 */
function Alert({ type, title, message, onClose }) {
  const icons = { success: '🎉', warning: '⚠️', error: '❌', info: 'ℹ️' };
  return (
    <div className="alert-overlay">
      <div className={`alert-box alert-box--${type}`}>
        <div className="alert-box__icon">{icons[type]}</div>
        <div className="alert-box__title">{title}</div>
        <div className="alert-box__message">{message}</div>
        <button className="alert-box__btn" onClick={onClose}>Aceptar</button>
      </div>
    </div>
  );
}

/**
 * Verifica en Firestore si el UUID extraído de un QR corresponde a una invitación válida.
 * Retorna un objeto con el tipo de alerta y el mensaje a mostrar.
 *
 * @async
 * @param {string} text - Texto leído del código QR.
 * @returns {Promise<{type: 'success'|'warning'|'error', title: string, message: string|JSX.Element}>}
 */
async function checkQr(text) {
  const uuid = extractUUID(text);
  if (!uuid)
    return { type: 'error', title: 'QR inválido', message: 'El código escaneado no es válido.' };
  try {
    const snap = await getDocs(query(collection(db, COLLECTION), where('uuid', '==', uuid)));
    if (snap.empty)
      return { type: 'error', title: 'No encontrado', message: 'La invitación no fue encontrada.' };
    const data = snap.docs[0].data();
    const nombre = data.name || 'Invitado';
    const asistentes = data.asistentes ?? 1;
    if (!data.is_confirmado)
      return { type: 'warning', title: 'Sin confirmación', message: <>{nombre} no confirmó su asistencia (<strong>{asistentes} {asistentes === 1 ? 'asistente' : 'asistentes'}</strong>). Favor de verificar disponibilidad con los novios.</> };
    return { type: 'success', title: '¡Bienvenido!', message: <>Invitación de {nombre} verificada correctamente. Ingresan <strong>{asistentes} {asistentes === 1 ? 'persona' : 'personas'}</strong>. ¡Bienvenidos a la boda! 💍</> };
  } catch {
    return { type: 'error', title: 'Error', message: 'Ocurrió un error al verificar la invitación.' };
  }
}

/**
 * Modal con cámara para escanear códigos QR de invitaciones.
 * Verifica el UUID escaneado contra Firestore y muestra el resultado en una alerta.
 *
 * @component
 * @param {Object} props
 * @param {Function} props.onClose - Callback para cerrar el modal del escaner.
 * @returns {JSX.Element}
 */
function QrModal({ onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const processingRef = useRef(false);
  const [alert, setAlert] = useState(null);

  const startScanner = () => {
    processingRef.current = false;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    reader.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      videoRef.current,
      async (result) => {
        if (!result || processingRef.current) return;
        processingRef.current = true;
        BrowserMultiFormatReader.releaseAllStreams();
        setAlert(await checkQr(result.getText()));
      }
    ).catch(() => {});
  };

  useEffect(() => {
    startScanner();
    return () => { BrowserMultiFormatReader.releaseAllStreams(); };
  }, []);

  const handleAlertClose = () => {
    setAlert(null);
    onClose();
  };

  return (
    <>
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal__header">
            <span className="modal__title">📷 Escanear invitación</span>
            <button className="modal__close" onClick={onClose}>✕</button>
          </div>
          <div className="modal__body">
            {!alert && <p className="modal__hint">Apunta la cámara al código QR de la invitación</p>}
            <video ref={videoRef} className="qr-video" />
          </div>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => handleAlertClose()}
        />
      )}
    </>
  );
}

/**
 * Componente principal de la lista pública de invitados confirmados.
 * Muestra estadísticas, buscador y tabla de invitados. Incluye botón flotante
 * para abrir el escaner QR.
 *
 * @component
 * @returns {JSX.Element}
 */
export default function App() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    const q = query(collection(db, COLLECTION), where('is_confirmado', '==', true));
    const unsub = onSnapshot(q,
      (snap) => {
        const sorted = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setGuests(sorted);
        setLoading(false);
      },
      (err) => { console.error(err); setLoading(false); }
    );
    return () => unsub();
  }, []);

  const filtered = guests.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="app-header">
        <h1>Misael &amp; Tiatira</h1>
        <p>Lista de invitados confirmados</p>
      </div>

      <div className="stats">
        <div className="stat-badge">
          <div className="stat-badge__icon">💌</div>
          <div className="stat-badge__value">{guests.length}</div>
          <div className="stat-badge__label">Confirmados</div>
        </div>
        <div className="stat-badge">
          <div className="stat-badge__icon">📅</div>
          <div className="stat-badge__value">15 Ene</div>
          <div className="stat-badge__label">Fecha</div>
        </div>
        <div className="stat-badge">
          <div className="stat-badge__icon">📍</div>
          <div className="stat-badge__value">Las Fuentes</div>
          <div className="stat-badge__label">Lugar</div>
        </div>
      </div>

      <div className="search-wrapper">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-container">
        {loading ? (
          <div className="state-empty">
            <div className="state-empty__icon">⏳</div>
            <p>Cargando invitados...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="state-empty">
            <div className="state-empty__icon">🔍</div>
            <p>{search ? 'Sin resultados para esa búsqueda.' : 'Aún no hay invitados confirmados.'}</p>
          </div>
        ) : (
          <>
            <p className="results-count">
              Mostrando {filtered.length} de {guests.length} confirmaciones
            </p>
            <table className="guest-table">
              <thead>
                <tr>
                  <th className="row-num">#</th>
                  <th>Nombre</th>
                  <th className="col-asistentes">Asistentes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g, i) => (
                  <tr key={g.id}>
                    <td className="row-num">{i + 1}</td>
                    <td>
                      <div className="guest-name-cell">
                        <div className="guest-avatar">
                          {g.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="guest-name-text">
                          {g.name || '—'}
                          <span className="asistentes-mobile">👥 {g.asistentes ?? 1}</span>
                        </span>
                      </div>
                    </td>
                    <td className="col-asistentes">
                      <span className="asistentes-badge">{g.asistentes ?? 1}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <button className="fab" onClick={() => setShowScanner(true)} aria-label="Escanear QR">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/>
          <rect x="3" y="16" width="5" height="5" rx="1"/><path d="M16 16h2v2h-2zM18 18h2v2h-2z"/>
          <path d="M11 3h2v2h-2zM3 11h2v2H3zM11 11h2v2h-2zM16 11h2v2h-2zM11 16h2v2h-2zM11 21h2v-2h-2z"/>
        </svg>
      </button>

      {showScanner && <QrModal onClose={() => setShowScanner(false)} />}
    </div>
  );
}
