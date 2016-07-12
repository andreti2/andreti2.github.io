//requerir los modulos
var express = require('express');

var app = express();

var http = require('http');//.Server(app);
http = http.Server(app);

var io = require('socket.io').listen(http);//(http);


//modulo para manejo de archivos
var fs = require('fs');
var registro = fs.createWriteStream(__dirname + '/publica/views/registro.txt',{'flags':'a'});

//numero de conectados actualmente
var conectados = 0;

//agregar el puerto del servidor
app.set('port', (process.env.PORT || 5000));

//para los archivos estaticos o recursos
app.use(express.static(__dirname + '/publica'));

//el servidor envia la pagina de inicio
app.get('/', function(req, res){
	res.sendFile(__dirname + '/publica/views/index.html');
});


//poner al servidor a escuchar por el puerto dado
http.listen(app.get('port'), function(){
	console.log('Servidor escuhando por el puerto : '+app.get('port') );
	registro.write("------------> SE INICIO EL SERVIDOR POR EL PUERTO :"+app.get('port') +" "+ darFecha()+ '\n\n');
});

//cuando alguien se conecta
io.sockets.on('connection', function(socket){

	//aumenta el numero de conectados
	conectados++;

	//emite el numero de conectados al cliente

	//unicamente a todos los clientes menos al que se conecto
	//socket.broadcast.emit('conexiones', {conectados:conectados});

	//emite a todos los clientes
	io.sockets.emit('conexiones', {conectados:conectados});

	// Detectamos eventos de mouse
	socket.on('movimientoMouse', function (data) {
	    // transmitimos el movimiento a todos los clientes conectados
	    socket.broadcast.emit('mover', data);
	    socket.broadcast.emit('conexiones', {conectados:conectados});
	});

	//cuando alguien se desconecta
	socket.on('disconnect', function() {
	  	//disminuye el numero de conectados
	  	conectados--;

	  	//emite el numero de conectados al cliente
	  	socket.broadcast.emit('conexiones', {conectados:conectados});
	 });

	//enviar a todos los clientes el nuevo mensaje
	socket.on('mensajeNuevo', function(msg){
	  	console.log("mensajeNuevo: "+msg.nick +": "+msg.mensaje);
	  	registro.write("-> "+msg.nick +" : "+msg.mensaje + darFecha()+ '\n\n');
	  	io.sockets.emit('mensajeNuevoCliente', {nick:msg.nick, mensaje:msg.mensaje});
	});

	//despues de conectarse se registra en el archivo de registros
	socket.on('registrarConexion',function(cadena){
	  	console.log("conectado: "+cadena);
	  	registro.write("-------->SE CONECTO EL CLIENTE : "+ cadena + darFecha() + '\n\n');
	});

	  console.log('conectados : ', conectados);
});


//funcion que retorna la fecha con un formato especifico
function darFecha(){
	fecha = new Date();
	fechaString = " ( "+fecha.getDay()+"/";
		fechaString += fecha.getMonth()+"/";
		fechaString += fecha.getFullYear()+" a las " ;
		fechaString += fecha.getHours()+":";
		fechaString += fecha.getMinutes()+":";
		fechaString += fecha.getSeconds()+" )";
return fechaString;
}

