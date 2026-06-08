import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NavbarComponent } from "../../shared/navbar/navbar.component";
import { TecnicoService } from "../../core/services/tecnico.service";
import { Tecnico,TecnicoCreate } from "../../models/tecnico.models";

@Component({
    selector: 'app-tecnicos-taller',
    standalone: true,
    imports: [CommonModule, FormsModule, NavbarComponent],
    templateUrl: './tecnicos-taller.component.html',
    styleUrls: ['./tecnicos-taller.component.scss']
})
export class TecnicosTallerComponent implements OnInit {
    tecnicos: Tecnico[] = []
    mostrarModal= false; 
    editando :Tecnico | null = null ; 
    loading = false;
    error = ''; 
    
    form : TecnicoCreate = this.getFormInicial(); 
        
    constructor(private tecnicoService :TecnicoService) { }
    
    ngOnInit(): void {
        this.cargarTecnico(); 
        
    }
    getFormInicial() : TecnicoCreate{
        return {
            codigo : '',
            nombre: '',
            telefono: '',
            disponibilidad: true
        };
    }
    cargarTecnico(): void {
        this.tecnicoService.listarMisTecnicos().subscribe({
            next:(data) =>{
                this.tecnicos= data ; 

            },
            error : (err) =>{
                this.error = err.status === 403
                  ? 'No tienes permiso para acceder a la información de este taller.'
                  : err.error?.detail || 'Error al cargar los técnicos';
            }
        });
    }
    abrirModal(tecnico ?: Tecnico): void {
        this.error = ''; 
        this.editando =  tecnico || null ; 
        if (tecnico){
            this.form = {
                codigo : tecnico.codigo, 
                nombre : tecnico.nombre,
                telefono : tecnico.telefono,
                disponibilidad : tecnico.disponibilidad
            }; 
        } else {
            this.form = this.getFormInicial();
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
    if (!this.form.codigo.trim() || !this.form.nombre.trim() || !this.form.telefono.trim()) {
      this.error = 'Completa CI, nombre y teléfono';
      return;
    }

    this.loading = true;
    this.error = '';

    const payload: TecnicoCreate = {
      codigo: this.form.codigo.trim(),
      nombre: this.form.nombre.trim(),
      telefono: this.form.telefono.trim(),
      disponibilidad: this.form.disponibilidad
    };

    const accion = this.editando
      ? this.tecnicoService.actualizarMiTecnico(this.editando.codigo, payload)
      : this.tecnicoService.crearMiTecnico(payload);

    accion.subscribe({
      next: () => {
        this.loading = false;
        this.cerrarModal();
        this.cargarTecnico();
      },
      error: (err) => {
        this.error = err.status === 403
          ? 'No tienes permiso para acceder a la información de este taller.'
          : err.error?.detail || 'Error al guardar técnico';
        this.loading = false;
      }
    });
  }

  eliminar(codigo: string): void {
    if (!confirm('¿Eliminar este técnico?')) return;

    this.tecnicoService.eliminarMiTecnico(codigo).subscribe({
      next: () => this.cargarTecnico(),
      error: (err) => {
        this.error = err.status === 403
          ? 'No tienes permiso para acceder a la información de este taller.'
          : err.error?.detail || 'Error al eliminar técnico';
      }
    });
  }

  toggleDisponibilidad(tecnico: Tecnico): void {
    this.tecnicoService.actualizarMiTecnico(tecnico.codigo, {
      disponibilidad: !tecnico.disponibilidad
    }).subscribe({
      next: () => this.cargarTecnico(),
      error: (err) => {
        this.error = err.status === 403
          ? 'No tienes permiso para acceder a la información de este taller.'
          : err.error?.detail || 'Error al actualizar disponibilidad';
      }
    });
  }
}
