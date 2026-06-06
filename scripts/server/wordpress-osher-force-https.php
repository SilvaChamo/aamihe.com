<?php
/**
 * Plugin Name: Osher — Force HTTPS
 * Description: oshercollective.com — URLs em HTTPS + HSTS. Copiar para wp-content/mu-plugins/
 * Version: 1.0.1
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!defined('OSHER_FORCE_HTTPS_HSTS')) {
    define('OSHER_FORCE_HTTPS_HSTS', 'max-age=31536000; includeSubDomains');
}

add_filter('home_url', 'osher_force_https_url', 10, 4);
add_filter('site_url', 'osher_force_https_url', 10, 4);
add_filter('content_url', 'osher_force_https_url', 10, 4);
add_filter('plugins_url', 'osher_force_https_url', 10, 4);
add_filter('theme_root_uri', 'osher_force_https_url', 10, 4);
add_filter('script_loader_src', 'osher_force_https_url', 10, 4);
add_filter('style_loader_src', 'osher_force_https_url', 10, 4);

/**
 * @param mixed $url
 */
function osher_force_https_url($url)
{
    if (!is_string($url) || $url === '') {
        return $url;
    }

    return set_url_scheme($url, 'https');
}

add_action('send_headers', static function (): void {
    if (!is_ssl() || headers_sent()) {
        return;
    }

    header('Strict-Transport-Security: ' . OSHER_FORCE_HTTPS_HSTS, true);
}, 1);
