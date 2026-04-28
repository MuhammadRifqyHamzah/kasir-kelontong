import { Component, ChangeDetectorRef } from '@angular/core';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { 
  cart, cube, receipt, create, trash, closeCircle, 
  downloadOutline, chevronForward, basket, close 
} from 'ionicons/icons';
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

  // Model Input
  baruNama: string = ''; baruStok: number = 0;
  baruPcs: number = 0; baruPack: number = 0; baruHdus: number = 0;
  baruH14: number = 0; baruH12: number = 0; baruH1k: number = 0;

  // Data
  daftarBarang: any[] = [];
  barangFilter: any[] = [];
  keranjang: any[] = [];
  totalBelanja: number = 0;
  kataKunci: string = '';
  sedangEdit: boolean = false;
  indexEdit: number = -1;
  transaksiTerakhir: any = null;
  riwayatPenjualan: any[] = [];

  constructor(
    private alertController: AlertController, 
    private toastController: ToastController, 
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ cart, cube, receipt, create, trash, closeCircle, downloadOutline, chevronForward, basket, close });
    this.muatData();
  }

  muatData() {
    const p = localStorage.getItem('DATA_PRODUK');
    const r = localStorage.getItem('RIWAYAT_PENJUALAN');
    if (p) this.daftarBarang = JSON.parse(p);
    if (r) this.riwayatPenjualan = JSON.parse(r);
    this.filterBarang();
  }

  simpanKeStorage() {
    localStorage.setItem('DATA_PRODUK', JSON.stringify(this.daftarBarang));
    localStorage.setItem('RIWAYAT_PENJUALAN', JSON.stringify(this.riwayatPenjualan));
  }

  setHalaman(n: string) {
    this.statusHalaman = n;
    if (n === 'kasir') this.filterBarang();
    if (n === 'tambah' && !this.sedangEdit) this.resetForm();
    this.cdr.detectChanges();
  }

  simpanBaru() {
    if (!this.baruNama) { this.presentToast('Nama produk wajib diisi!'); return; }
    const data = {
      nama: this.baruNama, stok: this.baruStok,
      pcs: this.baruPcs, pack: this.baruPack, hdus: this.baruHdus,
      h14: this.baruH14, h12: this.baruH12, h1k: this.baruH1k
    };
    if (this.sedangEdit) {
      this.daftarBarang[this.indexEdit] = data;
      this.presentToast('Data diperbarui!');
    } else {
      this.daftarBarang.push(data);
      this.presentToast('Data disimpan!');
    }
    this.simpanKeStorage();
    this.resetForm();
    this.filterBarang();
    this.cdr.detectChanges();
  }

  editBarang(b: any) {
    this.sedangEdit = true;
    this.indexEdit = this.daftarBarang.indexOf(b);
    this.baruNama = b.nama; 
    this.baruStok = b.stok;
    this.baruPcs = b.pcs || 0; 
    this.baruPack = b.pack || 0; 
    this.baruHdus = b.hdus || 0;
    this.baruH14 = b.h14 || 0; 
    this.baruH12 = b.h12 || 0; 
    this.baruH1k = b.h1k || 0;
    this.statusHalaman = 'tambah';
    this.cdr.detectChanges();
  }

  batalEdit() {
    this.resetForm();
    this.statusHalaman = 'tambah';
    this.cdr.detectChanges();
  }

  async hapusBarang(b: any) {
    const alert = await this.alertController.create({
      header: 'Hapus Produk?',
      message: `Hapus ${b.nama}?`,
      buttons: [{ text: 'Batal' }, { text: 'Hapus', handler: () => {
        this.daftarBarang = this.daftarBarang.filter(x => x !== b);
        this.simpanKeStorage();
        this.filterBarang();
        this.resetForm();
        this.cdr.detectChanges();
      }}]
    });
    await alert.present();
  }

  filterBarang() {
    this.barangFilter = this.kataKunci.trim() === '' ? [...this.daftarBarang] : 
      this.daftarBarang.filter(b => b.nama.toLowerCase().includes(this.kataKunci.toLowerCase()));
  }

  tambahKeKeranjang(barang: any, harga: number, satuan: string) {
    if (barang.stok <= 0) { this.presentToast('Stok habis!'); return; }
    const itemAda = this.keranjang.find(i => i.namaBarang === barang.nama && i.satuan === satuan);
    if (itemAda) {
      itemAda.jumlah += 1;
      itemAda.totalItem = itemAda.jumlah * harga;
    } else {
      this.keranjang.push({ namaBarang: barang.nama, hargaSatuan: harga, totalItem: harga, satuan: satuan, jumlah: 1 });
    }
    this.hitungTotal();
  }

  hapusDariKeranjang(idx: number) {
    this.keranjang.splice(idx, 1);
    this.hitungTotal();
  }

  hitungTotal() {
    this.totalBelanja = this.keranjang.reduce((acc, item) => acc + item.totalItem, 0);
    this.cdr.detectChanges();
  }

  prosesPembayaran() {
    if (this.keranjang.length === 0) return;
    this.keranjang.forEach(item => {
      const b = this.daftarBarang.find(x => x.nama === item.namaBarang);
      if (b) b.stok = Math.max(0, b.stok - item.jumlah);
    });
    this.transaksiTerakhir = { items: [...this.keranjang], total: this.totalBelanja, waktu: new Date().toLocaleString('id-ID') };
    this.riwayatPenjualan.unshift(this.transaksiTerakhir);
    this.simpanKeStorage();
    this.keranjang = []; this.totalBelanja = 0;
    this.statusHalaman = 'struk';
    this.cdr.detectChanges();
  }

  lihatDetail(t: any) { 
    this.transaksiTerakhir = t; 
    this.statusHalaman = 'struk'; 
    this.cdr.detectChanges();
  }

  async hapusRiwayat(idx: number, ev: any) {
    ev.stopPropagation();
    const alert = await this.alertController.create({
      header: 'Hapus Riwayat?',
      buttons: [{ text: 'Batal' }, { text: 'Hapus', handler: () => {
        this.riwayatPenjualan.splice(idx, 1);
        this.simpanKeStorage();
        this.cdr.detectChanges();
      }}]
    });
    await alert.present();
  }

  async cetakPDF() {
    const el = document.getElementById('struk-area');
    if (!el) return;
    const canvas = await html2canvas(el);
    const pdf = new jsPDF('p', 'mm',);
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 58, 0);
    pdf.save(`Struk_SobatGrocery.pdf`);
  }

  resetForm() {
    this.baruNama = ''; this.baruStok = 0;
    this.baruPcs = 0; this.baruPack = 0; this.baruHdus = 0;
    this.baruH14 = 0; this.baruH12 = 0; this.baruH1k = 0;
    this.sedangEdit = false; this.indexEdit = -1;
  }

  async presentToast(m: string) {
    const t = await this.toastController.create({ message: m, duration: 2000, position: 'bottom' });
    await t.present();
  }
}
