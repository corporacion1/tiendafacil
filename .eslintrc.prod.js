module.exports = {
  rules: {
    // Deshabilitar console.log en producción, permitir en desarrollo
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    
    // Ignorar líneas con logs de depuración
    'no-constant-condition': 'off',
  },
};
