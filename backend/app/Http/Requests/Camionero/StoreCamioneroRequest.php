<?php

namespace App\Http\Requests\Camionero;

use Illuminate\Foundation\Http\FormRequest;

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
            'email'            => ['required', 'email', 'max:255', 'unique:camioneros,email', 'unique:users,email'],
            'telefono'         => ['nullable', 'string', 'max:20'],
            'dni'              => ['required', 'string', 'max:20', 'unique:camioneros,dni'],
            'fecha_nacimiento' => ['required', 'date'],
        ];
    }
}
