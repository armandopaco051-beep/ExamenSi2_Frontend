export interface Usuario {
    codigo: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    estado: boolean;
    fecha_registro: string;
    rol: string;
    id_rol: number;
    nombre_rol: string;
    permisos: string[];
}

export interface loginRequest {
    identificador: string;
    password: string;
}
export interface LoginTecnico{
    codigo :string ;
    password : string ; 
}

export interface RegisterRequest {
  codigo: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  id_rol: number;
  codigo_taller?: number;
}

export interface TallerUsuario {
  id_usuario: string;
  codigo_taller: number;
  fecha_asignacion: string;
}

export interface Token{
    access_token: string;
    token_type: string;
    usuario: Usuario;
}
export interface Rol{
    id: number; 
    nombre: string;
}
export interface Permiso {
    id : number; 
    nombre : String
}