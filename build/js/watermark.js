window.onload = init;
var canvasW, canvasH, ofcanvasW, ofcanvasH;
function init() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = canvasW = 659;
    canvas.height = canvasH = 344;
    var image = new Image();
    image.src = '/images/2.jpg';
    image.onload = drawImage;
    function drawImage() {
        ctx.strokeStyle = '#000';
        ctx.drawImage(image, 0, 0, 659, 344);
        var ofcanvas = createCanvas();
        drawWaterMark(ofcanvas.ctx);
        console.log(ofcanvasW);
        ctx.drawImage(ofcanvas.canvas, 459, 264);
    }
}
function createCanvas() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.width = ofcanvasW = 200;
    ctx.height = ofcanvasW = 120;
    return { ctx: ctx, canvas: canvas };
}
function drawWaterMark(ctx) {

    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.fillRect(80, 0, 120, 80);
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = 'bold 20px Arial';
    ctx.lineWidth = '1';
    ctx.textAlign = 'end';
    ctx.textBaseline = 'middle';
    ctx.fillText('-- DM. --', 180, 40);
    ctx.restore();
}
//# sourceMappingURL=watermark.js.map
