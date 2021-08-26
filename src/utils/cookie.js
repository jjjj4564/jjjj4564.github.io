import Cookies from "js-cookie";

export function getCookie(key) {
  if(Cookies.get(key) === 'undefined') return undefined;
  return JSON.parse(Cookies.get(key))
}

export function setCookie(key, state) {
  return Cookies.set(key, JSON.stringify(state), {
    expires: 7,
    sameSite: 'Lax',
    domain: window.location.hostname
  })
}

