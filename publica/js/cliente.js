$(function(){


  //verificar que el navegador soporte el canvas
  if(!('getContext' in document.createElement('canvas'))){
    alert('Lo sentimos, tu navegador no soporta canvas!');
    return false;
  }

  // variables
  var doc = $(document);
  var win = $(window);
  var canvas = $('#plano');
  var info = $('#info');
  var conectados = $('#conectados');
  var ctx = canvas[0].getContext('2d');

  // id único para la session
  var id = Math.round($.now()*Math.random());

  // inicializamos el estado
  var dibujando = false;
  //lista de clientes
  var clientes = {};
  //lista de cursores
  var cursores = {};
  var prev = {};
  //sacar la fecha actual
  var ultimoEnvio = $.now();
  //darle un color aleatorio a cada cliente
  var cursorColor = colorAleatorio();

  //variables para el nombre
  var nombreTxt = "";
  var nombreLbl = document.getElementById("nombre");

  //variables para los mensajes
  var sendBtn = document.getElementById("sendBtn");
  var mensajesTxt = document.getElementById("msgs");
  var msg = document.getElementById("msg");


  //url a la cual se va a conectar
  var url = 'http://'+window.location.host;
  
  //variable de la comunicacion con el servidor
  var socket ;
  //var socket = io();

  //cargamos la funcion principal
  main();


  //cuando cargo todo el documento
  function main(){

      //tamaño del canvas
   canvas[0].width = window.innerWidth;
   canvas[0].heigth = window.innerHeight;

    //limpiar las cajas de texto
    mensajesTxt.value="";
    msg.value = "";

    //pedir el nick
    while(!validarCadena(nombreTxt)){
       nombreTxt = prompt("Digita tu nick.", "");
    }
    nombreTxt = nombreTxt.toUpperCase();

    //mostrar el nombre en la pagina
    nombreLbl.innerHTML = nombreTxt;

    // abrimos la conexion
    socket = io.connect(url);

    //enviamos al servidor el usuario que se conecto
    socket.emit('registrarConexion', nombreTxt );

    //agregar evento para el boton de enviar mensaje
    sendBtn.addEventListener('click',enviarMensaje);

    //agregar evento cuando se presiona la tecla enter en la caja de texto de mensaje
    msg.addEventListener('keydown', function(e){
      //evaluar que sea la tecla enter
      if(e.keyCode===13){
        e.preventDefault();
        enviarMensaje(); 
      }
    });

    // boton para limpiar el canvas
    var limpiarCanvas = document.getElementById('clean');
    limpiarCanvas.addEventListener('click',function(){
        ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
    });

  }



  //funcion que valida el mensaje y lo envia al servidor
  function enviarMensaje(){
      //validar que el mensaje no este vacio
      if(validarCadena(msg.value)){

        //le envia al servidor el nuevo mensaje
        socket.emit('mensajeNuevo',{nick:nombreTxt, mensaje:msg.value});

        //limpiar la caja de texto
        msg.value = "";
      }
  }




  //esta funcion recibe el mensaje emitido por el serdidor y lo muestra en el chat
  function mensajeNuevoCliente (mensaje){
    mensajesTxt.value +=mensaje.nick+': '+mensaje.mensaje+'\n\n';
  }



//funcion para validar que la cadena no este vacia
  function validarCadena(cadena){
    if(cadena != null){
      cadena = cadena.trim();
      return cadena == "" ? false : true;
    }
  }


//evento cuando se mueve el mouse
  function moverMouse(data) {

    //verificamos que en el arreglo de data el id este en el arreglo de clientes
    if(! (data.id in clientes)){
      //en este arreglo guardamos por id el cursor del cliente
      cursores[data.id] = $('<div class="cursor">').appendTo('#cursores');
    }

    //movemos el cursor a su posicion segun el id que trae la data
    cursores[data.id].css({
      'left' : data.x,
      'top' : data.y
    });

    //si en los datos de data el atributo dibujando es true entra de lo contrario no
    // y si el id que trae data se encuentra en el arreglo de clientes 
    if(data.dibujando && clientes[data.id]){
      //dibujar dentro del canvas segun
      dibujarCanvas(clientes[data.id].x, clientes[data.id].y, data.x, data.y, data.color);
    }

    //actualizamos el estado del cliente
    clientes[data.id] = data;
    //aumentamos un atributo que contiene la ultima vex de actualizacion
    clientes[data.id].updated = $.now();
  }

  //cuando se presiona en el canvas
  function mouseDownCanvas(e) {
    e.preventDefault();
    dibujando = true;
    prev.x = e.pageX;
    prev.y = e.pageY;

    // escondemos las instrucciones
    info.fadeOut();
  }

 //funcion que envia los datos del movimiento al servidor
  function mouseMoviendo(e) {

    //verificar que cada cierto tiempo se envie peticion al servidor
    if($.now() - ultimoEnvio > 10){

      //arreglo con informacion del movimiento
      var movimiento = {
        'x': e.pageX,
        'y': e.pageY,
        'dibujando': dibujando,
        'color': cursorColor,
        'id': id
      };

      //enviar al servidor el movimiento realizado
      socket.emit('movimientoMouse', movimiento);

      //almacenamos el momento del envio
      ultimoEnvio = $.now();
    }

    if(dibujando){

      dibujarCanvas(prev.x, prev.y, e.pageX, e.pageY, cursorColor);

      prev.x = e.pageX;
      prev.y = e.pageY;
    }
  }



  //funcion que dibuja en el canvas
  function dibujarCanvas(dex, dey, ax, ay, color){
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.moveTo(dex, dey);
    ctx.lineTo(ax, ay);
    ctx.stroke();
  }



//funcion que recibe del servidor el numero de conectados y lo muestra en pantalla
  function mostrarConectados(data) {
    console.log('conectados: ', data.conectados);
    conectados.text(data.conectados + ' conectados');
  }


//funcion para escoger un color aleatorio
  function colorAleatorio() {
    // from http://www.paulirish.com/2009/random-hex-color-code-snippets/
    return '#'+(function lol(m,s,c){return s[m.floor(m.random() * s.length)] +
    (c && lol(m,s,c-1));})(Math,'0123456789ABCDEF',4);
  }


  //eventos que se recibe  en la aplicacion
  socket.on('mover', moverMouse);
  socket.on('conexiones', mostrarConectados);
  socket.on('mensajeNuevoCliente',mensajeNuevoCliente);

  //cuando el mouse se mueve en el documento
  doc.on('mousemove', mouseMoviendo);

  //cuando se suelta el mouse o se lo deja
  doc.bind('mouseup mouseleave',function(){
    dibujando = false;
  });

  //cuando el mouse esta encima del canvas
  canvas.on('mousedown', mouseDownCanvas);


  //con esta funcion calculamos que la fecha actual menos la ultima actualizacion del cliente sea mayor
  //10000 osea 10 segundos eliminar del arreglo el cliente y el cursor 
  setInterval(function(){
    for(var id in clientes){
      if($.now() - clientes[id].updated > 10000){
        cursores[id].remove();
        delete clientes[id];
        delete cursores[id];
      }
    }
  },10000);
});