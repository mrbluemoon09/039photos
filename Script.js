const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const gallery = document.getElementById('gallery');

uploadBtn.onclick = () => fileInput.click();

fileInput.addEventListener('change', () => {
  const files = fileInput.files;
  for (let file of files) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      gallery.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});
