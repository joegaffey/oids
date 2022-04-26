export default class Utils {
  
  static scaleVerts(verts, scale) {
    const newVerts = JSON.parse(JSON.stringify(verts));
    newVerts.forEach(v => {
      v.x = v.x * scale;
      v.y = v.y * scale;
    });
    return newVerts;  
  }
  
  static shiftVerts(verts, shift) {
    const newVerts = JSON.parse(JSON.stringify(verts));
    newVerts.forEach(v => {
      v.x = v.x += shift;
      v.y = v.y += shift;
    });
    return newVerts; 
  }
  
  static getClippedImg(points, img, x, y) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x,points[0].y);
    for(let i = 1; i < points.length; i++)
      ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x, y);
    ctx.restore();
    return canvas.toDataURL('image/png');
  }
}