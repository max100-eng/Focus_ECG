# Importa los módulos necesarios
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import base64

# Crea una instancia de la aplicación Flask
app = Flask(__name__)
# Habilita CORS para permitir solicitudes desde el frontend (tu archivo HTML)
CORS(app)

# La función para llamar al modelo Gemini
# Sustituye la clave API con la que te proporcionará la plataforma
def call_gemini_api(prompt_text, image_data):
    """
    Llama al modelo Gemini para analizar el ECG.
    """
    try:
        # Aquí puedes dejar la clave API vacía, el entorno de Canvas se encargará de rellenarla
        api_key = "" 
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key={api_key}"

        # Estructura el payload para la API de Gemini
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": prompt_text},
                        {
                            "inlineData": {
                                "mimeType": "image/png",
                                "data": image_data.decode('utf-8')
                            }
                        }
                    ]
                }
            ]
        }

        # Envía la solicitud a la API de Gemini
        response = requests.post(api_url, headers={'Content-Type': 'application/json'}, data=json.dumps(payload))
        response.raise_for_status() # Lanza un error si la solicitud falla
        
        # Extrae la respuesta de la API
        result = response.json()
        if 'candidates' in result and len(result['candidates']) > 0:
            text_response = result['candidates'][0]['content']['parts'][0]['text']
            return text_response
        else:
            return "No se pudo obtener una respuesta del modelo."
    except requests.exceptions.RequestException as e:
        print(f"Error al llamar a la API de Gemini: {e}")
        return f"Error en el servidor: {e}"
    except json.JSONDecodeError as e:
        print(f"Error al decodificar la respuesta JSON: {e}")
        return "Error en el formato de la respuesta."

@app.route('/analizar', methods=['POST'])
def analizar_imagen():
    """
    Endpoint para recibir la imagen, procesarla y enviar la respuesta.
    """
    try:
        # Obtiene los datos del JSON enviado desde el frontend
        data = request.get_json()
        if 'imagen' not in data:
            return jsonify({"error": "No se recibió la imagen"}), 400

        # El frontend envía la imagen en formato base64
        base64_data = data['imagen'].split(',')[1]
        image_data = base64.b64decode(base64_data)

        # Prepara el prompt para el modelo
        prompt = "Analiza el siguiente electrocardiograma y proporciona un resumen de los resultados."

        # Llama a la API de Gemini
        response_text = call_gemini_api(prompt, image_data)

        # Devuelve la respuesta al frontend
        return jsonify({"resultado": response_text})

    except Exception as e:
        # Captura cualquier error y lo devuelve
        return jsonify({"error": str(e)}), 500

# Se ejecuta la aplicación Flask si el script se llama directamente
if __name__ == '__main__':
    # Esto inicia el servidor en http://localhost:5000
    app.run(host='0.0.0.0', port=5000, debug=True)