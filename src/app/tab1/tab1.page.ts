import { Component } from '@angular/core';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cart, cube, chevronForward, create, trash, closeCircle, receipt, informationCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class Tab1Page {
  statusHalaman: string = 'depan';

  // Variabel Form
  baruNama: string = '';
  baruStok: number = 0;
  baruPcs: number = 0;
  baruPack: number = 0;
  baruH14: number = 0;
  baruH12: number = 0;
  baruH1k: number = 0;
  baruHrcg: number = 0;
  baruHdus: number = 0;

  // Data
  daftarBarang: any[] = [];
  barangFilter: any[] = [];
  keranjang: any[] = [];
  totalBelanja: number = 0;
  kataKunci: string = '';
  sedangEdit: boolean = false;
  indexEdit: number = -1;

  // Fitur Struk & Riwayat
  transaksiTerakhir: any = null;
  riwayatPenjualan: any[] = [];

  constructor(
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({ cart, cube, chevronForward, create, trash, closeCircle, receipt, informationCircleOutline });
    
    // Data Contoh
    this.daftarBarang = [
      { nama: 'Sabun Lifeboy', stok: 10, pcs: 3500, pack: 0, h14: 0, h12: 0, h1k: 0, hrcg: 18000, hdus: 0 },
      { nama: 'Beras Ramos', stok: 50, pcs: 0, pack: 0, h14: 4000, h12: 7500, h1k: 14000, hrcg: 0, hdus: 0 }
    ];
    this.barangFilter = [...this.daftarBarang];
  }

  setHalaman(nama: string) {
    this.statusHalaman = nama;
    if (nama === 'kasir') this.filterBarang();
    this.resetForm();
  }

  async simpanBaru() {
    if (!this.baruNama) {
      this.presentToast('Nama produk tidak boleh kosong!');
      return;
    }
    const data = {
      nama: this.baruNama, stok: this.baruStok, pcs: this.baruPcs,
      pack: this.baruPack, h14: this.baruH14, h12: this.baruH12,
      h1k: this.baruH1k, hrcg: this.baruHrcg, hdus: this.baruHdus
    };
    if (this.sedangEdit) {
      this.daftarBarang[this.indexEdit] = data;
      this.presentToast('Data berhasil diperbarui!');
    } else {
      this.daftarBarang.push(data);
      this.presentToast('Produk baru ditambahkan!');
    }
    this.resetForm();
    this.filterBarang();
  }

  editBarang(barang: any) {
    this.sedangEdit = true;
    this.indexEdit = this.daftarBarang.indexOf(barang);
    this.baruNama = barang.nama;
    this.baruStok = barang.stok;
    this.baruPcs = barang.pcs || 0;
    this.baruPack = barang.pack || 0;
    this.baruH14 = barang.h14 || 0;
    this.baruH12 = barang.h12 || 0;
    this.baruH1k = barang.h1k || 0;
    this.baruHrcg = barang.hrcg || 0;
    this.baruHdus = barang.hdus || 0;
    window.scrollTo(0,0);
  }

  async hapusBarang(index: number) {
    const alert = await this.alertController.create({
      header: 'Hapus Produk?',
      buttons: [
        { text: 'Batal', role: 'cancel' },
        { text: 'Hapus', handler: () => {
          this.daftarBarang.splice(index, 1);
          this.filterBarang();
        }}
      ]
    });
    await alert.present();
  }

  resetForm() {
    this.baruNama = ''; this.baruStok = 0; 
    this.baruPcs = 0; this.baruPack = 0; this.baruH14 = 0; this.baruH12 = 0;
    this.baruH1k = 0; this.baruHrcg = 0; this.baruHdus = 0;
    this.sedangEdit = false; this.indexEdit = -1;
  }

  filterBarang() {
    this.barangFilter = this.kataKunci.trim() === '' ? [...this.daftarBarang] : 
      this.daftarBarang.filter(b => b.nama.toLowerCase().includes(this.kataKunci.toLowerCase()));
  }

  tambahKeKeranjang(barang: any, hargaSatuan: number, satuan: string) {
    const itemAda = this.keranjang.find(i => i.namaBarang === barang.nama && i.satuan === satuan);
    if (itemAda) {
      itemAda.jumlah += 1;
      itemAda.harga += hargaSatuan;
    } else {
      this.keranjang.push({ namaBarang: barang.nama, harga: hargaSatuan, satuan: satuan, jumlah: 1 });
    }
    this.totalBelanja += hargaSatuan;
  }

  hapusDariKeranjang(index: number, item: any) {
    this.totalBelanja -= item.harga;
    this.keranjang.splice(index, 1);
  }

  async prosesPembayaran() {
    const dataStruk = {
      items: [...this.keranjang],
      total: this.totalBelanja,
      waktu: new Date().toLocaleString('id-ID')
    };

    this.riwayatPenjualan.unshift(dataStruk);
    this.transaksiTerakhir = dataStruk;

    const alert = await this.alertController.create({
      header: 'Sukses',
      message: 'Transaksi Berhasil!',
      buttons: ['OK']
    });
    await alert.present();
    
    this.keranjang = [];
    this.totalBelanja = 0;
    this.statusHalaman = 'struk'; 
  }

  async presentToast(msg: string) {
    const toast = await this.toastController.create({ message: msg, duration: 2000, color: 'dark' });
    await toast.present();
  }
}