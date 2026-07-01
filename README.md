# ErgoSmart Chair - Web Simulation Dashboard

Simulasi antarmuka web interaktif untuk mendemonstrasikan sistem pemantauan postur duduk berbasis *Internet of Things* (IoT) pada kompetisi inovasi INFINITY 2026. 

## Deskripsi Singkat
Karena limitasi waktu dalam membawa *hardware* aktual (Sensor FSR & Mikrokontroler ESP32), *dashboard* web ini dibangun murni di sisi *client* menggunakan JavaScript untuk memanipulasi *mock-data*. Hasilnya memberikan visualisasi seketika seolah-olah data ditarik dari *hardware* secara riil.

## Fitur Utama
1. **Real-time 4x4 Heat Map:** Merender perubahan distribusi tekanan secara dinamis.
2. **Rule-Based Posture Detection:** Algoritma JavaScript yang memetakan array 16 titik menjadi status postur.
3. **Live Scoring & Trend Chart:** Animasi skor kualitas postur dan grafik analisis menggunakan Chart.js.
4. **Activity Logger:** Rekaman deteksi setiap perubahan mode.
5. **Warning Notification:** Sistem *popup* dan notifikasi audio (bunyi *beep*) jika pengguna duduk dalam posisi buruk lebih dari 5 detik.

## Teknologi yang Digunakan
* HTML5 & CSS3
* Tailwind CSS (via CDN)
* Vanilla JavaScript (ES6)
* Chart.js (via CDN)
* HTML5 Web Audio API

## Cara Menjalankan
1. *Download* atau *clone* repositori ini.
2. Pastikan struktur foldernya sama (file `.js` dan `.css` berada di dalam `/assets`).
3. Anda tidak perlu meng-install *Node.js* atau ekstensi *Backend* apapun.
4. Buka file `index.html` menggunakan browser modern pilihan Anda (Disarankan Google Chrome atau Edge).
5. Klik tombol-tombol pada Panel Simulasi Kiri untuk melihat antarmuka *smartphone* di sisi kanan berubah secara *real-time*.

## Catatan untuk Presentasi (Tips Juri)
Biarkan aplikasi dalam state **"Slouching Forward"** atau **"Leaning Left"** selama lebih dari 5 detik tanpa mengeklik tombol lain untuk menunjukkan fitur *Audio Beep* dan *Popup Notification* (peringatan otomatis) yang berfungsi dengan mulus.