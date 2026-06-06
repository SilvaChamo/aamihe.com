<?php
/**
 * Plugin Name: Osher — Core Protect
 * Description: Bloqueia vias comuns de alteração de ficheiros sem passar pelo fluxo normal do WordPress.
 */

if (!defined('ABSPATH')) {
    exit;
}

const OSHER_CORE_PROTECT_FILES = [
    'index.php',
    'wp-config.php',
    'wp-load.php',
    'wp-blog-header.php',
    'wp-settings.php',
];

/** XML-RPC (brute-force, pingback, exploits). */
add_filter('xmlrpc_enabled', '__return_false');
add_action('init', static function (): void {
    if (defined('XMLRPC_REQUEST') && XMLRPC_REQUEST) {
        status_header(403);
        header('Content-Type: text/plain; charset=UTF-8');
        exit('Forbidden');
    }
}, 0);

/** REST API: bloquear gestão de plugins/temas/utilizadores sem sessão. */
add_filter('rest_authentication_errors', static function ($result) {
    if (!empty($result) || is_user_logged_in()) {
        return $result;
    }

    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (preg_match('#/wp-json/(?:wp/v2/)?(plugins|themes|users|settings|batch)#i', $uri)) {
        return new WP_Error('osher_rest_forbidden', 'REST API restrita.', ['status' => 401]);
    }

    return $result;
}, 99);

/** Impedir que plugins usem a API de ficheiros do WP para escrever na raiz. */
add_filter('wp_handle_upload_prefilter', static function (array $file): array {
    $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
    if (in_array($ext, ['php', 'phtml', 'php5', 'phar', 'cgi', 'pl', 'asp', 'aspx'], true)) {
        $file['error'] = 'Tipo de ficheiro não permitido.';
    }
    return $file;
});

add_filter('upload_mimes', static function (array $mimes): array {
    unset($mimes['php'], $mimes['phtml'], $mimes['phar']);

    return $mimes;
});

/** Alerta se ficheiros core forem alterados (log do servidor). */
add_action('shutdown', static function (): void {
    static $checked = false;
    if ($checked || (defined('DOING_CRON') && DOING_CRON)) {
        return;
    }
    $checked = true;

    foreach (OSHER_CORE_PROTECT_FILES as $name) {
        $path = ABSPATH . $name;
        if (!is_file($path)) {
            error_log("[osher-core-protect] MISSING core file: {$name}");
            continue;
        }
        if (!is_readable($path)) {
            error_log("[osher-core-protect] Core file not readable: {$name}");
        }
    }
}, 9999);
