import { Component } from '@angular/core';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cart, cube, chevronForward, create, trash, closeCircle, receipt, informationCircleOutline, trashOutline, downloadOutline } from 'ionicons/icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class Tab1Page {
  statusHalaman: string = 'depan';
  baruNama: string = ''; baruStok: number = 0;
  baruPcs: number = 0; baruPack: number = 0; baruHdus: number = 0;
  baruH14: number = 0; baruH12: number = 0; baruH1k: number = 0;

  daftarBarang: any[] = [];
  barangFilter: any[] = [];
  keranjang: any[] = [];
  totalBelanja: number = 0;
  kataKunci: string = '';
  sedangEdit: boolean = false;
  indexEdit: number = -1;
  transaksiTerakhir: any = null;
  riwayatPenjualan: any[] = [];

  constructor(private alertController: AlertController, private toastController: ToastController) {
    addIcons({ cart, cube, chevronForward, create, trash, closeCircle, receipt, informationCircleOutline, trashOutline, downloadOutline });
    this.muatData();
  }

  muatData() {
    const dataTersimpan = localStorage.getItem('DATA_PRODUK');
    const riwayatTersimpan = localStorage.getItem('RIWAYAT_PENJUALAN');
    if (dataTersimpan) this.daftarBarang = JSON.parse(dataTersimpan);
    if (riwayatTersimpan) this.riwayatPenjualan = JSON.parse(riwayatTersimpan);
    this.filterBarang();
  }

  simpanKeStorage() {
    localStorage.setItem('DATA_PRODUK', JSON.stringify(this.daftarBarang));
    localStorage.setItem('RIWAYAT_PENJUALAN', JSON.stringify(this.riwayatPenjualan));
  }

  setHalaman(nama: string) {
    this.statusHalaman = nama;
    if (nama === 'kasir') this.filterBarang();
    if (nama !== 'tambah') this.resetForm();
  }

  async simpanBaru() {
    if (!this.baruNama) { this.presentToast('Nama produk kosong!'); return; }
    const data = {
      nama: this.baruNama, stok: this.baruStok, 
      pcs: this.baruPcs, pack: this.baruPack, hdus: this.baruHdus,
      h14: this.baruH14, h12: this.baruH12, h1k: this.baruH1k
    };
    if (this.sedangEdit) { this.daftarBarang[this.indexEdit] = data; } 
    else { this.daftarBarang.push(data); }
    this.simpanKeStorage();
    this.presentToast('Tersimpan!');
    this.resetForm();
    this.filterBarang();
  }

  editBarang(barang: any) {
    this.sedangEdit = true;
    this.indexEdit = this.daftarBarang.indexOf(barang);
    this.baruNama = barang.nama; this.baruStok = barang.stok;
    this.baruPcs = barang.pcs; this.baruPack = barang.pack; this.baruHdus = barang.hdus;
    this.baruH14 = barang.h14; this.baruH12 = barang.h12; this.baruH1k = barang.h1k;
  }

  async hapusBarang(barang: any) {
    const alert = await this.alertController.create({
      header: 'Hapus Produk?',
      message: `Yakin ingin menghapus ${barang.nama}?`,
      buttons: [{ text: 'Batal' }, { text: 'Hapus', handler: () => {
          const idx = this.daftarBarang.indexOf(barang);
          this.daftarBarang.splice(idx, 1);
          this.simpanKeStorage();
          this.filterBarang();
      } }]
    });
    await alert.present();
  }

  filterBarang() {
    this.barangFilter = this.kataKunci.trim() === '' ? [...this.daftarBarang] : 
      this.daftarBarang.filter(b => b.nama.toLowerCase().includes(this.kataKunci.toLowerCase()));
  }

  tambahKeKeranjang(barang: any, harga: number, satuan: string) {
    if (barang.stok <= 0) { this.presentToast('Stok Habis!'); return; }
    const itemAda = this.keranjang.find(i => i.namaBarang === barang.nama && i.satuan === satuan);
    if (itemAda) { itemAda.jumlah += 1; itemAda.totalItem = itemAda.jumlah * harga; } 
    else { this.keranjang.push({ namaBarang: barang.nama, hargaSatuan: harga, totalItem: harga, satuan: satuan, jumlah: 1 }); }
    this.hitungTotal();
  }

  hapusDariKeranjang(idx: number) {
    this.keranjang.splice(idx, 1);
    this.hitungTotal();
  }

  hitungTotal() {
    this.totalBelanja = this.keranjang.reduce((acc, item) => acc + item.totalItem, 0);
  }

  async prosesPembayaran() {
    if (this.keranjang.length === 0) return;
    this.keranjang.forEach(item => {
      const b = this.daftarBarang.find(x => x.nama === item.namaBarang);
      if (b) b.stok = Math.max(0, b.stok - item.jumlah);
    });
    const dataStruk = { items: [...this.keranjang], total: this.totalBelanja, waktu: new Date().toLocaleString('id-ID') };
    this.riwayatPenjualan.unshift(dataStruk);
    this.transaksiTerakhir = dataStruk;
    this.simpanKeStorage();
    this.keranjang = []; this.totalBelanja = 0;
    this.statusHalaman = 'struk'; 
  }

  lihatDetail(transaksi: any) {
    this.transaksiTerakhir = transaksi;
    this.statusHalaman = 'struk';
  }

  async hapusRiwayat(index: number, event: any) {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Hapus Riwayat?',
      message: 'Hapus transaksi ini dari riwayat?',
      buttons: [{ text: 'Batal' }, { text: 'Hapus', handler: () => {
          this.riwayatPenjualan.splice(index, 1);
          this.simpanKeStorage();
      } }]
    });
    await alert.present();
  }

  async cetakPDF() {
    const elemen = document.getElementById('struk-area');
    if (!elemen) return;
    const canvas = await html2canvas(elemen);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm',);
    pdf.addImage(imgData, 'PNG', 0, 0, 80, 0);
    pdf.save(`Struk_${this.transaksiTerakhir.waktu}.pdf`);
  }

  resetForm() {
    this.baruNama = ''; this.baruStok = 0; 
    this.baruPcs = 0; this.baruPack = 0; this.baruHdus = 0;
    this.baruH14 = 0; this.baruH12 = 0; this.baruH1k = 0;
    this.sedangEdit = false;
  }

  async presentToast(m: string) {
    const t = await this.toastController.create({ message: m, duration: 2000 });
    await t.present();
  }
}
