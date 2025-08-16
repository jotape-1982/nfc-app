import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { Loader2, QrCode, MapPin } from 'lucide-react';

// Se utiliza la URL inyectada por Vite, que ahora es la ruta relativa /api
const API_URL = import.meta.env.VITE_API_URL || '/api';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

const PublicNfcRedirect: React.FC = () => {
  const { tagId } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const [loadingMessage, setLoadingMessage] = useState<string>("Iniciando proceso...");
  const [error, setError] = useState<string | null>(null);

  // Función auxiliar para enviar logs al backend
  const sendClientLog = async (level: string, message: string, details?: any) => {
    try {
      await axios.post(`${API_URL}/client-log`, {
        level: level,
        message: message,
        timestamp: new Date().toISOString(),
        sourceUrl: window.location.href,
        details: details ? JSON.stringify(details) : null,
      });
    } catch (logError) {
      console.error("Error enviando log al backend (fallo del logger):", logError);
    }
  };

  useEffect(() => {
    sendClientLog("INFO", "PublicNfcRedirect: useEffect iniciado.");
    sendClientLog("INFO", `PublicNfcRedirect: API_URL configurada: ${API_URL}`);

    const handleNfcTap = async () => {
      sendClientLog("INFO", `PublicNfcRedirect: Inicia handleNfcTap para tagId: ${tagId}`);

      if (!tagId) {
        setError("ID de tag NFC no proporcionado en la URL.");
        sendClientLog("ERROR", "PublicNfcRedirect: tagId es nulo o indefinido. No se puede proceder.");
        return;
      }

      let locationData: LocationData | null = null;
      setLoadingMessage("Obteniendo geolocalización (requiere tu permiso)...");
      sendClientLog("INFO", "PublicNfcRedirect: Intentando obtener geolocalización.");

      if (navigator.geolocation) {
        try {
          const position: GeolocationPosition = await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error("Tiempo de espera agotado para la geolocalización."));
            }, 5000);

            navigator.geolocation.getCurrentPosition(
              (pos) => {
                clearTimeout(timeoutId);
                resolve(pos);
              },
              (err) => {
                clearTimeout(timeoutId);
                reject(err);
              },
              {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
              }
            );
          });
          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          setLoadingMessage("Geolocalización obtenida. Registrando tap...");
          sendClientLog("INFO", "PublicNfcRedirect: Geolocalización obtenida.", locationData);
        } catch (geoError: unknown) {
          sendClientLog("WARN", "PublicNfcRedirect: Error al obtener geolocalización o usuario la denegó.", geoError);
          setLoadingMessage("No se pudo obtener geolocalización. Registrando tap...");
        }
      } else {
        sendClientLog("WARN", "PublicNfcRedirect: Geolocalización no soportada por este navegador.");
        setLoadingMessage("Geolocalización no soportada. Registrando tap...");
      }

      try {
        const clientInfo = {
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          devicePixelRatio: window.devicePixelRatio,
          platform: navigator.platform,
          language: navigator.language,
        };
        sendClientLog("INFO", "PublicNfcRedirect: Información del cliente:", clientInfo);

        sendClientLog("INFO", `PublicNfcRedirect: Enviando POST a ${API_URL}/tap-event`);
        const tapResponse = await axios.post(`${API_URL}/tap-event`, {
          tagId: tagId,
          locationData: locationData ? JSON.stringify(locationData) : null,
          clientInfo: JSON.stringify(clientInfo),
        });
        sendClientLog("INFO", `PublicNfcRedirect: Respuesta de tapResponse: ${tapResponse.status}`);

        if (tapResponse.status !== 201) {
          throw new Error(`Error al registrar el tap NFC: Código de estado ${tapResponse.status}.`);
        }

        setLoadingMessage("Tap registrado. Obteniendo URL de redirección...");
        sendClientLog("INFO", `PublicNfcRedirect: Enviando GET a ${API_URL}/public/tag-info/${tagId}`);
        
        const tagInfoResponse = await axios.get(`${API_URL}/public/tag-info/${tagId}`);
        sendClientLog("INFO", `PublicNfcRedirect: Respuesta de tagInfoResponse: ${tagInfoResponse.status}`);
        
        if (tagInfoResponse.status === 200 && tagInfoResponse.data.public_url) {
          setLoadingMessage("Redirigiendo...");
          // **CAMBIO CLAVE:** Aseguramos que la URL se incluya en el mensaje
          sendClientLog("INFO", `PublicNfcRedirect: Redirigiendo a: ${tagInfoResponse.data.public_url}`);
          window.location.replace(tagInfoResponse.data.public_url);
        } else {
          setError("URL de redirección no encontrada para este tag.");
          sendClientLog("ERROR", "PublicNfcRedirect: URL de redirección no encontrada o respuesta inesperada.", tagInfoResponse.data);
        }

      } catch (err: unknown) {
        sendClientLog("ERROR", "PublicNfcRedirect: Error CRÍTICO en el proceso de tap NFC.", err);
        if (err instanceof AxiosError) {
          const serverMessage = (err.response?.data as any)?.message;
          if (serverMessage) {
            setError(`Error del servidor: ${serverMessage}`);
            sendClientLog("ERROR", `PublicNfcRedirect: Mensaje del servidor: ${serverMessage}`);
          } else if (err.response) {
            setError(`Error del servidor: Código ${err.response.status}. Respuesta inesperada.`);
            sendClientLog("ERROR", `PublicNfcRedirect: Respuesta de error de Axios (sin mensaje): ${err.response.status}`, err.response);
          } else if (err.request) {
            setError('Error de red: No se pudo conectar con el servidor. Asegúrate de que el backend esté funcionando.');
            sendClientLog("ERROR", "PublicNfcRedirect: Error de red (sin respuesta):", err.request);
          } else {
            setError(`Error en la solicitud: ${err.message}`);
            sendClientLog("ERROR", `PublicNfcRedirect: Error de Axios (otro): ${err.message}`);
          }
        } else if (err instanceof Error) {
          setError(`Ocurrió un error inesperado: ${err.message}.`);
          sendClientLog("ERROR", `PublicNfcRedirect: Error genérico: ${err.message}`);
        } else {
          setError("Ocurrió un error desconocido durante el proceso de tap.");
          sendClientLog("ERROR", "PublicNfcRedirect: Error completamente desconocido:", err);
        }
      }
    };

    handleNfcTap();
  }, [tagId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 text-center">
      <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center">
        {error ? (
          <>
            <MapPin className="text-red-500 mb-4" size={64} />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Error al procesar el Tap</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-gray-600">Por favor, verifica el tag NFC o contacta al soporte.</p>
          </>
        ) : (
          <>
            <QrCode className="text-blue-500 mb-4 animate-bounce" size={64} />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Procesando Tap NFC...</h1>
            <p className="text-gray-600 mb-4">{loadingMessage}</p>
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </>
        )}
      </div>
    </div>
  );
};

export default PublicNfcRedirect;