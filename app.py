import streamlit as st
import requests
import json
import base64

# La función para llamar al modelo Gemini
def call_gemini_api(prompt_text, image_data):
    """
    Llama al modelo Gemini para analizar el ECG.
    """
    try:
        # Usa st.secrets para manejar tu clave de API de forma segura
        api_key = st.secrets["gemini_api_key"] 
        api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key={api_key}"

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

        response = requests.post(api_url, headers={'Content-Type': 'application/json'}, data=json.dumps(payload))
        response.raise_for_status()
        
        result = response.json()
        if 'candidates' in result and len(result['candidates']) > 0:
            text_response = result['candidates'][0]['content']['parts'][0]['text']
            return text_response
        else:
            return "No se pudo obtener una respuesta del modelo."
    except requests.exceptions.RequestException as e:
        st.error(f"Error al llamar a la API de Gemini: {e}")
        return f"Error en el servidor: {e}"
    except json.JSONDecodeError as e:
        st.error(f"Error al decodificar la respuesta JSON: {e}")
        return "Error en el formato de la respuesta."

# --- Interfaz de usuario de Streamlit ---
st.title("Análisis de ECG con IA")

uploaded_file = st.file_uploader("Sube una imagen de un ECG", type=['png', 'jpg', 'jpeg'])

if uploaded_file is not None:
    # Muestra la imagen subida
    st.image(uploaded_file, caption="ECG Subido")
    
    # Convierte la imagen a base64 para la API
    image_data = base64.b64encode(uploaded_file.getvalue())

    # Prepara el prompt
    prompt = "Analiza el siguiente electrocardiograma y proporciona un resumen de los resultados."

    # Llama a la API cuando se hace clic en el botón
    if st.button("Analizar ECG"):
        with st.spinner('Analizando...'):
            response_text = call_gemini_api(prompt, image_data)
            st.subheader("Resultado del Análisis:")
            st.write(response_text)
