import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense
import numpy as np
import os

# 1. Crear una carpeta para guardar los modelos si no existe
models_dir = 'models'
if not os.path.exists(models_dir):
    os.makedirs(models_dir)
    print(f"Carpeta '{models_dir}' creada.")

# 2. Definir la arquitectura de un modelo simple (simulando un visual_model para ECG)
# Este modelo es muy básico; un modelo real para ECG sería más complejo.
model = Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(150, 150, 3)), # Asumimos imágenes RGB de 150x150
    MaxPooling2D((2, 2)),
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),
    Flatten(),
    Dense(128, activation='relu'),
    Dense(1, activation='sigmoid') # Salida para clasificación binaria (ej. normal/arritmia)
])

# 3. Compilar el modelo
model.compile(optimizer='adam',
              loss='binary_crossentropy',
              metrics=['accuracy'])

print("Modelo creado y compilado.")
model.summary() # Muestra un resumen de las capas del modelo

# 4. Simular datos de entrenamiento (¡En la vida real usarías tus datos de ECG!)
# Creamos datos aleatorios para simular el entrenamiento.
# En tu caso, serían imágenes de ECG preprocesadas y sus etiquetas.
num_samples = 100
dummy_images = np.random.rand(num_samples, 150, 150, 3).astype(np.float32)
dummy_labels = np.random.randint(0, 2, num_samples).astype(np.float32) # 0 o 1

print(f"\nSimulando entrenamiento con {num_samples} imágenes...")

# 5. Entrenar el modelo (¡Esta es la parte que aprende!)
# En un escenario real, 'epochs' y el tamaño del dataset serían mucho mayores.
history = model.fit(dummy_images, dummy_labels, epochs=5, batch_size=32, verbose=0)

print("Entrenamiento simulado completado.")
print(f"Precisión final simulada: {history.history['accuracy'][-1]:.4f}")

# 6. Guardar el modelo entrenado en un archivo .h5
# Este es el comando clave que crea el archivo 'visual_model.h5'
model_save_path = os.path.join(models_dir, 'visual_model.h5')
model.save(model_save_path)

print(f"\n¡Modelo guardado exitosamente en: {model_save_path}!")
print("Ahora puedes cargar este archivo en tu backend para usar el modelo sin reentrenarlo.")

# Opcional: Cargar el modelo para verificar que se guardó correctamente
# loaded_model = tf.keras.models.load_model(model_save_path)
# print("\nModelo cargado para verificación:")
# loaded_model.summary()