import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { TecnicoService } from '../../core/services/tecnico.service';
import { TallerService } from '../../core/services/taller.service';
import { Tecnico, TecnicoCreate, TecnicoUpdate } from '../../models/tecnico.models';
import { Taller } from '../../models/taller.model';

@Component({
  selector: 'app-tecnicos',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './tecnicos.component.html',
  styleUrls: ['./tecnico.component.scss']
})
export class TecnicosComponent implements OnInit {
  tecnicos: Tecnico[] = [];
  talleres: Taller[] = [];
  mostrarModal = false;
  editando: Tecnico | null = null;
  loading = false;
  error = '';
  tallerSeleccionado = 0;

  form: TecnicoCreate = this.getFormInicial();

  constructor(
    private tecnicoService: TecnicoService,
    private tallerService: TallerService
  ) {}

  ngOnInit(): void {
    this.cargarTalleres();
  }

  getFormInicial(): TecnicoCreate {
    return {
      codigo: '',
      nombre: '',
      disponibilidad: true,
      latitud: 0,
      longitud: 0,
      telefono: '',
      id_taller: 0
    };
  }

  cargarTalleres(): void {
    this.tallerService.listar().subscribe({
      next: (data) => {
        this.talleres = data;

        if (data.length > 0) {
          this.tallerSeleccionado = data[0].codigo;
          this.cargarTecnicos(this.tallerSeleccionado);
        }
      },
      error: () => {
        this.error = 'No se pudieron cargar los talleres';
      }
    });
  }

  cargarTecnicos(id_taller: number): void {
    this.tallerSeleccionado = Number(id_taller);

    this.tecnicoService.listarPorTaller(this.tallerSeleccionado).subscribe({
      next: (data) => {
        this.tecnicos = data;
      },
      error: () => {
        this.error = 'No se pudieron cargar los técnicos';
      }
    });
  }

  obtenerNombreTaller(id_taller: number): string {
    const taller = this.talleres.find(t => t.codigo === id_taller);
    return taller ? taller.nombre : `Taller #${id_taller}`;
  }

  obtenerAccesoTecnico(tecnico: Tecnico): string {
    return tecnico.email || tecnico.codigo;
  }

  onTallerSeleccionado(id_taller: number): void {
    this.form.id_taller = Number(id_taller);

    const taller = this.talleres.find(t => t.codigo === this.form.id_taller);
    if (taller) {
      this.form.latitud = Number((taller as any).latitud ?? 0);
      this.form.longitud = Number((taller as any).longitud ?? 0);
    }
  }

  abrirModal(tecnico?: Tecnico): void {
    this.editando = tecnico || null;
    this.error = '';

    if (tecnico) {
      this.form = {
        codigo: tecnico.codigo,
        nombre: tecnico.nombre,
        disponibilidad: tecnico.disponibilidad,
        latitud: tecnico.latitud,
        longitud: tecnico.longitud,
        telefono: tecnico.telefono,
        id_taller: tecnico.id_taller,
      };
    } else {
      this.form = this.getFormInicial();
      this.form.id_taller = this.tallerSeleccionado || 0;
      if (this.form.id_taller) {
        this.onTallerSeleccionado(this.form.id_taller);
      }
    }

    this.mostrarModal = true;
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.editando = null;
    this.error = '';
    this.form = this.getFormInicial();
  }

  guardar(): void {
    this.error = '';

    if (!this.form.codigo.trim()) {
      this.error = 'El CI / código es obligatorio';
      return;
    }

    if (!this.form.nombre.trim()) {
      this.error = 'El nombre es obligatorio';
      return;
    }

    if (!this.form.telefono.trim()) {
      this.error = 'El teléfono es obligatorio';
      return;
    }

    if (!this.form.id_taller) {
      this.error = 'Debes seleccionar un taller';
      return;
    }

    this.loading = true;

    if (this.editando) {
      const datosActualizar: TecnicoUpdate = {
        nombre: this.form.nombre,
        telefono: this.form.telefono,
        disponibilidad: this.form.disponibilidad,
        latitud: this.form.latitud,
        longitud: this.form.longitud,
        id_taller: this.form.id_taller,
        id_rol: 3
      };

      this.tecnicoService.actualizar(this.editando.codigo, datosActualizar).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarTecnicos(this.tallerSeleccionado);
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.detail || 'Error al actualizar técnico';
          this.loading = false;
        }
      });

      return;
    }

    const codigoCi = this.form.codigo.trim();

    const datosCrear: TecnicoCreate = {
      ...this.form
    };

    this.tecnicoService.crear(datosCrear).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarTecnicos(this.tallerSeleccionado);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Error al guardar técnico';
        this.loading = false;
      }
    });
  }

  eliminar(codigo: string): void {
    if (!confirm('¿Eliminar este técnico?')) return;

    this.tecnicoService.eliminar(codigo).subscribe({
      next: () => this.cargarTecnicos(this.tallerSeleccionado),
      error: () => {
        this.error = 'No se pudo eliminar el técnico';
      }
    });
  }

  toggleDisponibilidad(tecnico: Tecnico): void {
    this.tecnicoService.actualizar(tecnico.codigo, {
      disponibilidad: !tecnico.disponibilidad
    }).subscribe({
      next: () => this.cargarTecnicos(this.tallerSeleccionado),
      error: () => {
        this.error = 'No se pudo actualizar la disponibilidad';
      }
    });
  }
}