import { UserRole } from "../../generated/prisma/enums";


export interface IRegisterPayload  {
  name: string;
  email: string;
  password: string;
  role?:UserRole // optional, default = STUDENT
};

export interface ILoginUserPayload  {
  email: string;
  password: string;
};


export interface IRequestUser{
  role:string;
  userId:string;
  email: string;

}
export interface IUpdateUser{
  name?:string;
  image?:string;
}
export interface IChangePassword{
  sessionToken:string;
  currentPassword:string;
  newPassword:string;
}

