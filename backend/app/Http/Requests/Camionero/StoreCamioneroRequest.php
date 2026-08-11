<?php

namespace App\Http\Requests\Camionero;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCamioneroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre'           => ['required', 'string', 'max:100'],
            'apellidos'        => ['required', 'string', 'max:150'],
            'email'            => [
                'required', 'email', 'max:255',
                Rule::unique('camioneros', 'email')->whereNull('deleted_at'),
                Rule::unique('users', 'email'),
            ],
            'telefono'         => ['nullable', 'string', 'max:20'],
            'dni'              => [
                'nullable', 'string', 'max:20',
                Rule::unique('camioneros', 'dni')->whereNull('deleted_at'),
            ],
            'fecha_nacimiento' => ['nullable', 'date'],
            'almacen_id'       => ['nullable', 'exists:almacenes,id'],
            'rol'              => ['required', 'in:admin,camionero'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required'    => 'El nombre es obligatorio.',
            'apellidos.required' => 'Los apellidos son obligatorios.',
            'email.required'     => 'El email es obligatorio.',
            'email.email'        => 'El email no tiene un formato válido.',
            'email.unique'       => 'Este email ya está registrado.',
            'dni.unique'                => 'Este DNI ya está registrado.',
            'fecha_nacimiento.date'     => 'La fecha de nacimiento no es válida.',
            'rol.required'       => 'El rol es obligatorio.',
            'rol.in'             => 'El rol debe ser admin o camionero.',
        ];
    }
}
