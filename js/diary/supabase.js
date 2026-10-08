"use strict";
const SUPABASE_URL = "https://jzyymrjxlhyrqyedzkhu.supabase.co";
// Publishable keyをここで一度だけ設定する。
// ほかのTSファイルではこのsupabaseClientを使う。
const SUPABASE_ANON_KEY = "sb_publishable_oRajBPM63vSnkUbxGmOzSA_lkwRbFw3";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;
