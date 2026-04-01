<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar Contraseña</title>
</head>
<body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 0;">

    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <tr>
            <td style="background: linear-gradient(90deg, #005461 0%, #0C7779 100%); text-align: center; padding: 30px 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">TELECOM</h1>
            </td>
        </tr>

        <tr>
            <td style="padding: 40px 30px; color: #495057; line-height: 1.6;">
                <h2 style="margin-top: 0; color: #005461; font-size: 20px;">Hola, {{ $user->name }}</h2>
                
                <p style="font-size: 16px;">Estás recibiendo este correo porque solicitaste restablecer la contraseña de tu cuenta en el sistema <strong>Telecom</strong>.</p>
                
                <p style="font-size: 16px;">Haz clic en el botón de abajo para crear tu nueva contraseña segura:</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="{{ $url }}" style="background-color: #3BC1A8; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Restablecer mi Contraseña</a>
                </div>
                
                <p style="font-size: 14px; color: #6c757d;">Este enlace de recuperación expirará en 60 minutos.</p>
                <p style="font-size: 14px; color: #6c757d;">Si no realizaste esta solicitud, puedes ignorar este correo de forma segura. Tu cuenta sigue protegida.</p>
            </td>
        </tr>

        <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="margin: 0; font-size: 12px; color: #adb5bd;">&copy; {{ date('Y') }} Telecom. Todos los derechos reservados.</p>
                <p style="margin: 5px 0 0 0; font-size: 11px; color: #adb5bd;">Si tienes problemas haciendo clic en el botón, copia y pega esta URL en tu navegador web: <br> <span style="color: #3BC1A8; word-break: break-all;">{{ $url }}</span></p>
            </td>
        </tr>
    </table>

</body>
</html>