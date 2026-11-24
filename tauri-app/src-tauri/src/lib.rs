#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Плагин cors-fetch (reqwest) берёт системный HTTP-прокси macOS (например, приложение-прокси на 127.0.0.1:1082)
  // и игнорирует его список исключений, поэтому запросы к бэкенду по адресу ZeroTier уходят в прокси и обрываются
  // («connection closed before message completed»). Переменные окружения reqwest учитывает раньше системных
  // настроек: адреса локальных и виртуальных сетей помечаются NO_PROXY и идут напрямую.
  // Приложение обращается только к бэкенду и MinIO в такой сети, остальные запросы выполняет WebView.
  // Переменные задаются до запуска потоков, поэтому set_var безопасна.
  if std::env::var_os("NO_PROXY").is_none() && std::env::var_os("HTTP_PROXY").is_none() {
    unsafe {
      std::env::set_var("NO_PROXY", "localhost,127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16");
      std::env::set_var("HTTP_PROXY", "http://127.0.0.1:9");
    }
  }
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    // Запросы fetch выполняются средствами Rust и не подпадают под CORS браузера
    .plugin(tauri_plugin_cors_fetch::init())
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
