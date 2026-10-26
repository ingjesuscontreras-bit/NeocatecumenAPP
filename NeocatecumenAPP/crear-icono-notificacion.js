const Jimp = require('jimp');

const ORIGEN = 'assets/images/android-icon-monochrome.png';
const DESTINO = 'assets/images/notification-icon.png';

(async () => {
  const img = await Jimp.read(ORIGEN);
  img.resize(96, 96);
  img.scan(0, 0, 96, 96, function (x, y, idx) {
    this.bitmap.data[idx] = 255;
    this.bitmap.data[idx + 1] = 255;
    this.bitmap.data[idx + 2] = 255;
  });
  await img.writeAsync(DESTINO);
  console.log('Listo:', DESTINO);
})().catch((e) => {
  console.log('No se pudo crear el ícono:', e.message);
  process.exit(1);
});
