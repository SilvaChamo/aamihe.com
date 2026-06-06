<?php
/**
 * Plugin Name: AAMIHE — Brevo SMTP (central)
 * Description: Envio wp_mail via Brevo. Credenciais em /usr/local/share/wordpress-mu-plugins/brevo-smtp-config.php
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

$config_path = '/usr/local/share/wordpress-mu-plugins/brevo-smtp-config.php';
if (!is_readable($config_path)) {
    return;
}

/** @var array<string, mixed>|false $aamihe_brevo_smtp_config */
$aamihe_brevo_smtp_config = require $config_path;
if (
    !is_array($aamihe_brevo_smtp_config)
    || empty($aamihe_brevo_smtp_config['host'])
    || empty($aamihe_brevo_smtp_config['user'])
    || empty($aamihe_brevo_smtp_config['pass'])
) {
    return;
}

/**
 * @return array{email: string, name: string}
 */
function aamihe_brevo_smtp_from(): array
{
    global $aamihe_brevo_smtp_config;

    $host = wp_parse_url(home_url(), PHP_URL_HOST);
    if (!is_string($host) || $host === '') {
        $host = '';
    }
    $host = strtolower(preg_replace('/^www\./', '', $host));

    $by_domain = $aamihe_brevo_smtp_config['from_by_domain'] ?? [];
    if ($host !== '' && is_array($by_domain) && !empty($by_domain[$host]) && is_array($by_domain[$host])) {
        $entry = $by_domain[$host];
        $email = isset($entry['email']) ? (string) $entry['email'] : '';
        if ($email !== '') {
            return [
                'email' => $email,
                'name' => isset($entry['name']) ? (string) $entry['name'] : (string) get_bloginfo('name'),
            ];
        }
    }

    $admin = (string) get_option('admin_email');
    if ($host !== '' && $admin !== '' && substr(strtolower($admin), -strlen('@' . $host)) === '@' . $host) {
        return [
            'email' => $admin,
            'name' => (string) get_bloginfo('name'),
        ];
    }

    if ($host !== '') {
        return [
            'email' => 'noreply@' . $host,
            'name' => (string) get_bloginfo('name'),
        ];
    }

    return [
        'email' => $admin !== '' ? $admin : 'noreply@localhost',
        'name' => (string) get_bloginfo('name'),
    ];
}

add_action('phpmailer_init', static function ($phpmailer): void {
    global $aamihe_brevo_smtp_config;

    if (!is_object($phpmailer)) {
        return;
    }

    $from = aamihe_brevo_smtp_from();
    $port = (int) ($aamihe_brevo_smtp_config['port'] ?? 587);
    $secure = strtolower((string) ($aamihe_brevo_smtp_config['secure'] ?? 'tls'));

    $phpmailer->isSMTP();
    $phpmailer->Host = (string) $aamihe_brevo_smtp_config['host'];
    $phpmailer->Port = $port;
    $phpmailer->SMTPAuth = true;
    $phpmailer->Username = (string) $aamihe_brevo_smtp_config['user'];
    $phpmailer->Password = (string) $aamihe_brevo_smtp_config['pass'];
    $phpmailer->SMTPSecure = ($secure === 'ssl' || $port === 465) ? 'ssl' : 'tls';
    $phpmailer->From = $from['email'];
    $phpmailer->FromName = $from['name'];
});

add_filter('wp_mail_from', static function (): string {
    return aamihe_brevo_smtp_from()['email'];
});

add_filter('wp_mail_from_name', static function (): string {
    return aamihe_brevo_smtp_from()['name'];
});
