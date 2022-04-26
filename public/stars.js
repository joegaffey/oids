export default class Stars {
  constructor(count, ctx) {
    this.count = count;
    this.ctx = ctx;
    this.ctx.fillStyle = 'white';
    this.ctx.globalAlpha = 0.5;
    this.twinkleFactor = 0.9995;
    this.starSize = 5;     
  }
  
  init() {
    this.stars = [];
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height); 
    for(let i = 0; i < this.count; i++) {
      let star = {};
      star.scale = this.starSize * Math.random();
      this.placeStar(star);
      this.stars.push(star);
    } 
  }
  
  placeStar(star) {
    star.x = Math.floor(Math.random() * this.ctx.canvas.width);
    star.y = Math.floor(Math.random() * this.ctx.canvas.width);
  }
  
  update(x, y) {
    const width = this.ctx.canvas.width;
    const height = this.ctx.canvas.height;
    
    this.ctx.clearRect(0, 0, width, height); 
    this.ctx.fillStyle = 'white';
    this.ctx.globalAlpha = 0.5;
    this.stars.forEach((star) => {
      star.x -= x;
      star.y -= y;
      
      if(height < star.y || star.y < 0 || width < star.x || star.x < 0) {
        this.placeStar(star);
      }
      else if(Math.random() > this.twinkleFactor)
        this.placeStar(star);
      this.ctx.fillRect(star.x, star.y, star.scale, star.scale);
    });
  }
}
