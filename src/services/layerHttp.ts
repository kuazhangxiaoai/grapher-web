import axios from "axios";

interface Res<T = any> {
  code: number;
  data: T;
  msg: string;
}

export const useHttpClient = () => {
  const baseHref = 'http://10.11.52.243:8098';

  const get = async <T = any>(url: string): Promise<Res<T>> => {
    const data: Res<T> = await axios
      .get(`${baseHref}${url}`)
      .then((res) => res.data);
    return data;
  };

  const post = async <T = Res>(url: string, data: any): Promise<T> => {
    const datares: T = await axios
      .post(`${baseHref}${url}`, data)
      .then((res) => res.data);
    return datares;
  };

  return { get, post };
};
