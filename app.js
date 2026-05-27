// Configuración del Broker MQTT (EMQX Público)
const BROKER_HOST = "broker.emqx.io";
const BROKER_PORT = 8084; // Puerto WebSockets para EMQX
const CLIENT_ID = "web" + Math.random().toString(16).substr(2, 8);

// IMPORTANTE: En Paho MQTT para conectar a EMQX, a veces hace falta especificar la ruta
const client = new Paho.MQTT.Client(BROKER_HOST, BROKER_PORT, "/mqtt", CLIENT_ID);

client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

conectarMQTT();

function conectarMQTT() {
    console.log("Intentando conectar al Broker MQTT...");
    client.connect({
        onSuccess: onConnect,
        onFailure: onFailure,
        useSSL: true,
        keepAliveInterval: 60
    });
}


// Qué pasa cuando se conecta con éxito
function onConnect() {
    console.log("¡Conectado al Broker MQTT!");
    
    // Actualizar la interfaz visual del estado
    const statusLabel = document.getElementById("mqtt-status");
    statusLabel.textContent = "Conectado";
    statusLabel.className = "connected";

    // SUSCRIPCIONES (Escuchar lo que dicen la ESP32 y FlexSim)
    // Nos suscribimos a todos los sub-temas de nuestro proyecto usando el comodín '#'
    client.subscribe("proyecto/gemelodigital/#");
}

// Qué pasa si falla la conexión inicial
function onFailure(responseObject) {
    console.log("Fallo al conectar: " + responseObject.errorMessage);
    setTimeout(conectarMQTT, 5000); // Reintentar a los 5 segundos
}

// Qué pasa si se pierde la conexión a mitad de camino
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Conexión perdida: " + responseObject.errorMessage);
        const statusLabel = document.getElementById("mqtt-status");
        statusLabel.textContent = "Desconectado";
        statusLabel.className = "disconnected";
        
        // Intentar reconectar automáticamente
        setTimeout(conectarMQTT, 5000);
    }
}

// RECEPCIÓN DE MENSAJES: Aquí llega la telemetría en tiempo real
function onMessageArrived(message) {
    const topic = message.destinationName;
    const payload = message.payloadString;

    console.log(`Mensaje recibido -> Topic: ${topic} | Mensaje: ${payload}`);

    // Filtrar el comportamiento según el Topic de procedencia
    if (topic === "proyecto/gemelodigital/flexsim/cajas") {
        document.getElementById("txt-contador-cajas").textContent = payload;
    } 
    else if (topic === "proyecto/gemelodigital/flexsim/estado") {
        document.getElementById("txt-estado-sim").textContent = payload;
    } 
    else if (topic === "proyecto/gemelodigital/esp32/sensor") {
        document.getElementById("txt-sensor-fisico").textContent = payload;
    }
    else if (topic === "proyecto/gemelodigital/esp32/alerta") {
        document.getElementById("txt-alerta-hardware").textContent = payload;
    }
}

// ENVÍO DE MENSAJES (Control Remoto desde los botones de la web)
function enviarComando(subTopic, valor) {
    // Verificamos si estamos conectados antes de enviar
    if (!client.isConnected()) {
        alert("No estás conectado al Broker MQTT. No se puede enviar el comando.");
        return;
    }

    const topicCompleto = "proyecto/gemelodigital/" + subTopic;
    const message = new Paho.MQTT.Message(valor);
    message.destinationName = topicCompleto;
    
    client.send(message);
    console.log(`Mensaje enviado -> Topic: ${topicCompleto} | Valor: ${valor}`);
}