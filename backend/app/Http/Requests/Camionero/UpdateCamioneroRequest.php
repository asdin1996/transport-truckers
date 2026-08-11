<?php

namespace App\Http\Requests\Camionero;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCamioneroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id     = $this->route('camionero');
        $userId = \App\Models\Camionero::find($id)?->user_id;

        return [
            'nombre'           => ['sometimes', 'string', 'max:100'],
            'apellidos'        => ['sometimes', 'string', 'max:150'],
            'email'            => [
                'sometimes', 'email', 'max:255',
                Rule::unique('camioneros', 'email')->ignore($id)->whereNull('deleted_at'),
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'telefono'         => ['nullable', 'string', 'max:20'],
            'dni'              => [
                'sometimes', 'string', 'max:20',
                Rule::unique('camioneros', 'dni')->ignore($id)->whereNull('deleted_at'),
            ],
            'fecha_nacimiento' => ['sometimes', 'nullable', 'date'],
            'almacen_id'       => ['nullable', 'exists:almacenes,id'],
            'vehiculo_id'      => ['nullable', 'exists:vehiculos,id'],
            'rol'              => ['sometimes', 'in:admin,camionero'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.email'              => 'El email no tiene un formato válido.',
            'email.unique'             => 'Este email ya está registrado.',
            'dni.unique'               => 'Este DNI ya está registrado.',
            'fecha_nacimiento.date'    => 'La fecha de nacimiento no es válida.',
            'rol.in'                   => 'El rol debe ser admin o camionero.',
        ];
    }
}
