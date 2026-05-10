/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface CreateOrUpdateThemePayload {
  theme: Record<string, string>;
}

export interface CreateOrUpdateThemeData {
  success: boolean;
  message: string;
  data: {
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    id: number;
    theme: any;
  };
}

export interface DeleteThemeData {
  success: boolean;
  message: string;
}

export interface GetAllNotificationPreferencesParams {
  /**
   * @default "1"
   * @pattern ^\d+$
   */
  page?: string;
  /**
   * @default "10"
   * @pattern ^\d+$
   */
  pagesize?: string;
  /**
   * [{'id':'fields_name','operator':'eq','value':1,'type':'number'}]
   * @default []
   */
  filters?: any;
  /**
   * [{'id':'fields_name','desc':'true'}]
   * @default []
   */
  sort?: any;
  search?: string;
  /** @default "and" */
  joinOperator?: "and" | "or";
}

export interface GetAllNotificationPreferencesData {
  data: {
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    id: number;
    en_name: string;
    ar_name: string | null;
    en_description: string | null;
    ar_description: string | null;
    /** @format date-time */
    created_at: string;
    /** @format date-time */
    updated_at: string;
    notifications: {
      /**
       * @min -9007199254740991
       * @max 9007199254740991
       */
      id: number;
      code: string;
      en_name: string;
      ar_name: string;
      en_description: string | null;
      ar_description: string | null;
      user_preferences: {
        /**
         * @min -9007199254740991
         * @max 9007199254740991
         */
        id: number;
        /**
         * @min -9007199254740991
         * @max 9007199254740991
         */
        user_id: number;
        /**
         * @min -9007199254740991
         * @max 9007199254740991
         */
        notification_setting_id: number;
        enabled: boolean;
        delivery_channels: any;
        /** @format date-time */
        created_at: string;
        /** @format date-time */
        updated_at: string;
      }[];
    }[];
  }[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface UpdateUserNotificationPreferencesPayload {
  preferences: {
    notification_setting_id: number;
    enabled: boolean;
    delivery_channels: ("IN_APP" | "PUSH" | "EMAIL" | "WHATSAPP")[];
  }[];
}

export interface UpdateUserNotificationPreferencesParams {
  userId: string;
}

export interface UpdateUserNotificationPreferencesData {
  success: boolean;
  message: string;
}

export interface GetUsersParams {
  /**
   * @default "1"
   * @pattern ^\d+$
   */
  page?: string;
  /**
   * @default "10"
   * @pattern ^\d+$
   */
  pagesize?: string;
  /**
   * [{'id':'fields_name','operator':'eq','value':1,'type':'number'}]
   * @default []
   */
  filters?: any;
  /**
   * [{'id':'fields_name','desc':'true'}]
   * @default []
   */
  sort?: any;
  search?: string;
  /** @default "and" */
  joinOperator?: "and" | "or";
}

export interface GetUsersData {
  data: {
    language: "AR" | "EN";
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    id: number;
    name: string | null;
    email: string;
    confirmed_email: boolean;
    active: boolean;
    available: boolean;
    /** @format date-time */
    created_at: string;
    /** @format date-time */
    updated_at: string;
    two_factor_authentication: boolean;
    two_factor_authentication_code: string | null;
    user_types: {
      /**
       * @min -9007199254740991
       * @max 9007199254740991
       */
      id: number;
      name: string;
    }[];
  }[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface CreateUserPayload {
  /**
   * @format email
   * @pattern ^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   */
  email: string;
  password: string;
  name: string;
  user_type_ids: number[];
  active: boolean;
  confirmed_email: boolean;
}

export interface CreateUserData {
  message: string;
}

export interface UpdateUserPayload {
  /**
   * @format email
   * @pattern ^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   */
  email?: string;
  password?: string;
  name?: string;
  user_type_ids?: number[];
  active?: boolean;
  confirmed_email?: boolean;
}

export interface UpdateUserParams {
  id: string;
}

export interface UpdateUserData {
  message: string;
}

export interface DeleteUserParams {
  id: string;
}

export interface DeleteUserData {
  message: string;
}

export interface GetUserTypesParams {
  /**
   * @default "1"
   * @pattern ^\d+$
   */
  page?: string;
  /**
   * @default "10"
   * @pattern ^\d+$
   */
  pagesize?: string;
  /**
   * [{'id':'fields_name','operator':'eq','value':1,'type':'number'}]
   * @default []
   */
  filters?: any;
  /**
   * [{'id':'fields_name','desc':'true'}]
   * @default []
   */
  sort?: any;
  search?: string;
  /** @default "and" */
  joinOperator?: "and" | "or";
}

export interface GetUserTypesData {
  data: {
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    id: number;
    name: string;
    permissions: {
      /**
       * @min -9007199254740991
       * @max 9007199254740991
       */
      id: number;
      en_name: string;
      en_description: string | null;
      ar_description: string | null;
      ar_name: string | null;
      code: string;
      en_action: string | null;
      ar_action: string | null;
      /**
       * @min -9007199254740991
       * @max 9007199254740991
       */
      permission_role_id: number | null;
      /**
       * @min -9007199254740991
       * @max 9007199254740991
       */
      permission_category_id: number | null;
    }[];
    users: {
      language: "AR" | "EN";
      /**
       * @min -9007199254740991
       * @max 9007199254740991
       */
      id: number;
      name: string | null;
      email: string;
      confirmed_email: boolean;
      active: boolean;
      available: boolean;
      /** @format date-time */
      created_at: string;
      /** @format date-time */
      updated_at: string;
      two_factor_authentication: boolean;
      two_factor_authentication_code: string | null;
    }[];
  }[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface CreateUserTypePayload {
  name: string;
  permissions_ids: number[];
}

export interface CreateUserTypeData {
  message: string;
}

export interface UpdateUserTypePayload {
  permissions: number[];
  name: string;
}

export interface UpdateUserTypeParams {
  id: string;
}

export interface UpdateUserTypeData {
  message: string;
}

export interface DeleteUserTypeParams {
  id: string;
}

export interface DeleteUserTypeData {
  message: string;
}

export interface GetPermissionCategoriesParams {
  role: "admin" | "user";
}

export type GetPermissionCategoriesData = {
  /**
   * @min -9007199254740991
   * @max 9007199254740991
   */
  id: number;
  en_name: string;
  ar_name: string | null;
  en_description: string | null;
  ar_description: string | null;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
  permissions: {
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    id: number;
    en_name: string;
    en_description: string | null;
    ar_description: string | null;
    ar_name: string | null;
    code: string;
    en_action: string | null;
    ar_action: string | null;
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    permission_role_id: number | null;
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    permission_category_id: number | null;
  }[];
  notifications: {
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    id: number;
    code: string;
    en_name: string;
    ar_name: string;
    en_description: string | null;
    ar_description: string | null;
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    permission_category_id: number | null;
    /** @format date-time */
    createdAt: string;
    /** @format date-time */
    updatedAt: string;
  }[];
}[];

export interface LoginPayload {
  /**
   * @format email
   * @pattern ^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   * @example "admin@fastify-template.com"
   */
  email: string;
  /**
   * @minLength 6
   * @example "12345678"
   */
  password: string;
  device_token?: string;
}

export interface LoginData {
  /** JWT access token */
  accessToken?: string;
  /** Requires 2FA */
  requires2FA: boolean;
  /** User name */
  user_name?: string | null;
  /** User types */
  user_types?: string[];
  /** Timestamp when the 2FA code expires */
  expiresAt?: number;
  /** ISO string when the 2FA code expires */
  expiresAtISO?: string;
}

export interface Resend2FaCodePayload {
  /**
   * @format email
   * @pattern ^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   */
  email: string;
}

export interface Resend2FaCodeData {
  success: boolean;
  message: string;
  /** Timestamp when the 2FA code expires */
  expiresAt: number;
}

export interface Verify2FaLoginPayload {
  /**
   * @format email
   * @pattern ^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   */
  email: string;
  /** @minLength 1 */
  two_factor_token: string;
  device_token?: string;
}

export interface Verify2FaLoginData {
  accessToken: string;
  user_name: string | null;
  user_types: string[];
}

export interface VerifyEmailPayload {
  /**
   * @format email
   * @pattern ^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   */
  email: string;
  code: string;
}

export interface VerifyEmailData {
  message: string;
}

export interface ResendEmailCodePayload {
  /**
   * @format email
   * @pattern ^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   */
  email: string;
}

export interface ResendEmailCodeData {
  message: string;
}

export interface PrepareResetPasswordPayload {
  /**
   * @format email
   * @pattern ^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   */
  email: string;
}

export interface PrepareResetPasswordData {
  message: string;
}

export interface ResetPasswordPayload {
  /** @minLength 4 */
  reset_password_code: string;
  /** @minLength 8 */
  password: string;
  /**
   * @format email
   * @pattern ^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$
   */
  email: string;
}

export interface ResetPasswordData {
  message: string;
}

export interface GetThemeData {
  success: boolean;
  data: {
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    id: number;
    theme: any;
  };
}

export interface UploadImagePayload {
  /** @format binary */
  file: File;
}

export type UploadImageData = object;

export interface MeParams {
  device_token?: string;
}

export interface MeData {
  language: "AR" | "EN";
  /**
   * @min -9007199254740991
   * @max 9007199254740991
   */
  id: number;
  name: string | null;
  email: string;
  confirmed_email: boolean;
  active: boolean;
  available: boolean;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
  two_factor_authentication: boolean;
  two_factor_authentication_code: string | null;
  devices: {
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    id: number;
    fcmTokens: string | null;
    login_location: string;
    device_info: string;
    /** @format date-time */
    created_at: string;
    /** @format date-time */
    updated_at: string;
  }[];
  user_types: {
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    id: number;
    name: string;
    permissions: {
      /**
       * @min -9007199254740991
       * @max 9007199254740991
       */
      id: number;
      en_name: string;
      en_description: string | null;
      ar_description: string | null;
      ar_name: string | null;
      code: string;
      en_action: string | null;
      ar_action: string | null;
      /**
       * @min -9007199254740991
       * @max 9007199254740991
       */
      permission_role_id: number | null;
      /**
       * @min -9007199254740991
       * @max 9007199254740991
       */
      permission_category_id: number | null;
    }[];
  }[];
}

export interface ChangeLanguagePayload {
  language: "AR" | "EN";
}

export interface ChangeLanguageData {
  message: string;
}

export interface ChangePasswordPayload {
  /** @minLength 1 */
  current_password: string;
  /** @minLength 8 */
  new_password: string;
}

export interface ChangePasswordData {
  success: boolean;
  message: string;
}

export interface SaveTokenPayload {
  /** @minLength 1 */
  token: string;
}

export interface SaveTokenData {
  message: string;
}

export interface GetUserDevicesData {
  success: boolean;
  data: {
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    id: number;
    fcmTokens: string | null;
    login_location: string;
    device_info: string;
    /** @format date-time */
    created_at: string;
    /** @format date-time */
    updated_at: string;
  }[];
}

export interface DeleteDeviceSessionParams {
  /**
   * @exclusiveMin true
   * @max 9007199254740991
   */
  id: number;
}

export interface DeleteDeviceSessionData {
  success: boolean;
  message: string;
}

export interface LogoutData {
  message: string;
}

export interface LogoutFromAllDevicesData {
  message: string;
}

export interface GetNotificationPreferencesData {
  success: boolean;
  data: {
    /**
     * @min -9007199254740991
     * @max 9007199254740991
     */
    id: number;
    en_name: string;
    ar_name: string | null;
    en_description: string | null;
    ar_description: string | null;
    /** @format date-time */
    created_at: string;
    /** @format date-time */
    updated_at: string;
    notifications: {
      /**
       * @min -9007199254740991
       * @max 9007199254740991
       */
      id: number;
      code: string;
      en_name: string;
      ar_name: string;
      en_description: string | null;
      ar_description: string | null;
      user_preferences: {
        /**
         * @min -9007199254740991
         * @max 9007199254740991
         */
        id: number;
        /**
         * @min -9007199254740991
         * @max 9007199254740991
         */
        user_id: number;
        /**
         * @min -9007199254740991
         * @max 9007199254740991
         */
        notification_setting_id: number;
        enabled: boolean;
        delivery_channels: any;
        /** @format date-time */
        created_at: string;
        /** @format date-time */
        updated_at: string;
      }[];
    }[];
  }[];
}

export interface UpdateNotificationPreferencesPayload {
  preferences: {
    notification_setting_id: number;
    enabled: boolean;
    delivery_channels: ("IN_APP" | "PUSH" | "EMAIL" | "WHATSAPP")[];
  }[];
}

export interface UpdateNotificationPreferencesData {
  success: boolean;
  message: string;
}

export interface Disable2FaPayload {
  /** @minLength 1 */
  currentPassword: string;
}

export interface Disable2FaData {
  success: boolean;
  data?: {
    message?: string;
  };
}

export interface Setup2FaPayload {
  method: "otp" | "totp";
}

export interface Setup2FaData {
  success: boolean;
  data?: {
    code?: string;
    qrCode?: string;
    secret?: string;
    message?: string;
  };
}

export interface Toggle2FaData {
  success: boolean;
  data: {
    message: string;
    enabled: boolean;
  };
}

export interface Verify2FaPayload {
  /** @minLength 1 */
  token: string;
  method: "otp" | "totp";
}

export interface Verify2FaData {
  success: boolean;
  data?: {
    message?: string;
  };
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title fastify-template
 * @version 1.0.0
 */
export class Apis<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  themes = {
    /**
     * No description
     *
     * @tags themes
     * @name CreateOrUpdateTheme
     * @summary Create or update theme
     * @request PUT:/themes/admin/settings/theme
     * @secure
     */
    createOrUpdateTheme: (
      data: CreateOrUpdateThemePayload,
      params: RequestParams = {},
    ) =>
      this.request<CreateOrUpdateThemeData, any>({
        path: `/themes/admin/settings/theme`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags themes
     * @name DeleteTheme
     * @summary Delete theme
     * @request DELETE:/themes/admin/settings/theme
     * @secure
     */
    deleteTheme: (params: RequestParams = {}) =>
      this.request<DeleteThemeData, any>({
        path: `/themes/admin/settings/theme`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags themes
     * @name GetTheme
     * @summary Get theme
     * @request GET:/themes/public/theme
     * @secure
     */
    getTheme: (params: RequestParams = {}) =>
      this.request<GetThemeData, any>({
        path: `/themes/public/theme`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  userManagement = {
    /**
     * No description
     *
     * @tags user-management
     * @name GetAllNotificationPreferences
     * @summary Get all notification settings with their user preferences grouped by permission category
     * @request GET:/user-management/admin/notification-preferences
     * @secure
     */
    getAllNotificationPreferences: (
      query: GetAllNotificationPreferencesParams,
      params: RequestParams = {},
    ) =>
      this.request<GetAllNotificationPreferencesData, any>({
        path: `/user-management/admin/notification-preferences`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-management
     * @name UpdateUserNotificationPreferences
     * @summary Update user notification preferences
     * @request PUT:/user-management/admin/notification-preferences/{user_id}
     * @secure
     */
    updateUserNotificationPreferences: (
      { userId, ...query }: UpdateUserNotificationPreferencesParams,
      data: UpdateUserNotificationPreferencesPayload,
      params: RequestParams = {},
    ) =>
      this.request<UpdateUserNotificationPreferencesData, any>({
        path: `/user-management/admin/notification-preferences/${userId}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-management
     * @name GetUsers
     * @summary Get all users
     * @request GET:/user-management/admin/users
     * @secure
     */
    getUsers: (query: GetUsersParams, params: RequestParams = {}) =>
      this.request<GetUsersData, any>({
        path: `/user-management/admin/users`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-management
     * @name CreateUser
     * @request POST:/user-management/admin/users
     * @secure
     */
    createUser: (data: CreateUserPayload, params: RequestParams = {}) =>
      this.request<CreateUserData, any>({
        path: `/user-management/admin/users`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-management
     * @name UpdateUser
     * @request PUT:/user-management/admin/users/{id}
     * @secure
     */
    updateUser: (
      { id, ...query }: UpdateUserParams,
      data: UpdateUserPayload,
      params: RequestParams = {},
    ) =>
      this.request<UpdateUserData, any>({
        path: `/user-management/admin/users/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-management
     * @name DeleteUser
     * @request DELETE:/user-management/admin/users/{id}
     * @secure
     */
    deleteUser: (
      { id, ...query }: DeleteUserParams,
      params: RequestParams = {},
    ) =>
      this.request<DeleteUserData, any>({
        path: `/user-management/admin/users/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-management
     * @name GetUserTypes
     * @summary Get all undefined
     * @request GET:/user-management/admin/users-types
     * @secure
     */
    getUserTypes: (query: GetUserTypesParams, params: RequestParams = {}) =>
      this.request<GetUserTypesData, any>({
        path: `/user-management/admin/users-types`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-management
     * @name CreateUserType
     * @request POST:/user-management/admin/users-types
     * @secure
     */
    createUserType: (data: CreateUserTypePayload, params: RequestParams = {}) =>
      this.request<CreateUserTypeData, any>({
        path: `/user-management/admin/users-types`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-management
     * @name UpdateUserType
     * @request PUT:/user-management/admin/users-types/{id}
     * @secure
     */
    updateUserType: (
      { id, ...query }: UpdateUserTypeParams,
      data: UpdateUserTypePayload,
      params: RequestParams = {},
    ) =>
      this.request<UpdateUserTypeData, any>({
        path: `/user-management/admin/users-types/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-management
     * @name DeleteUserType
     * @request DELETE:/user-management/admin/users-types/{id}
     * @secure
     */
    deleteUserType: (
      { id, ...query }: DeleteUserTypeParams,
      params: RequestParams = {},
    ) =>
      this.request<DeleteUserTypeData, any>({
        path: `/user-management/admin/users-types/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-management
     * @name GetPermissionCategories
     * @summary Get all permission categories with their permissions, roles, and notification settings
     * @request GET:/user-management/admin/users-types/permission-categories
     * @secure
     */
    getPermissionCategories: (
      query: GetPermissionCategoriesParams,
      params: RequestParams = {},
    ) =>
      this.request<GetPermissionCategoriesData, any>({
        path: `/user-management/admin/users-types/permission-categories`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  auth = {
    /**
     * No description
     *
     * @tags auth
     * @name Login
     * @summary Login
     * @request POST:/auth/public/login
     * @secure
     */
    login: (data: LoginPayload, params: RequestParams = {}) =>
      this.request<LoginData, any>({
        path: `/auth/public/login`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name Resend2FaCode
     * @summary Resend 2FA code
     * @request POST:/auth/public/login/resend-2fa
     * @secure
     */
    resend2FaCode: (data: Resend2FaCodePayload, params: RequestParams = {}) =>
      this.request<Resend2FaCodeData, any>({
        path: `/auth/public/login/resend-2fa`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name Verify2FaLogin
     * @summary Verify 2FA code after login
     * @request POST:/auth/public/login/verify-2fa
     * @secure
     */
    verify2FaLogin: (data: Verify2FaLoginPayload, params: RequestParams = {}) =>
      this.request<
        Verify2FaLoginData,
        {
          success: boolean;
          message: string;
          remaining_attempts: number;
          blockedUntil: number | null;
          blockedUntilISO: string;
        }
      >({
        path: `/auth/public/login/verify-2fa`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Verify email
     *
     * @tags register
     * @name VerifyEmail
     * @summary Verify email
     * @request POST:/auth/public/register/verify-email
     * @secure
     */
    verifyEmail: (data: VerifyEmailPayload, params: RequestParams = {}) =>
      this.request<VerifyEmailData, any>({
        path: `/auth/public/register/verify-email`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Resend email confirmation code
     *
     * @tags register
     * @name ResendEmailCode
     * @summary Resend email confirmation code
     * @request POST:/auth/public/register/resend-email-confirmation-code
     * @secure
     */
    resendEmailCode: (
      data: ResendEmailCodePayload,
      params: RequestParams = {},
    ) =>
      this.request<ResendEmailCodeData, any>({
        path: `/auth/public/register/resend-email-confirmation-code`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags reset password
     * @name PrepareResetPassword
     * @request POST:/auth/public/reset-password/prepare
     * @secure
     */
    prepareResetPassword: (
      data: PrepareResetPasswordPayload,
      params: RequestParams = {},
    ) =>
      this.request<
        PrepareResetPasswordData,
        {
          message: string;
        }
      >({
        path: `/auth/public/reset-password/prepare`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags reset password
     * @name ResetPassword
     * @request POST:/auth/public/reset-password/reset
     * @secure
     */
    resetPassword: (data: ResetPasswordPayload, params: RequestParams = {}) =>
      this.request<ResetPasswordData, any>({
        path: `/auth/public/reset-password/reset`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  upload = {
    /**
     * No description
     *
     * @tags upload
     * @name UploadImage
     * @request POST:/upload/public/image
     * @secure
     */
    uploadImage: (data: UploadImagePayload, params: RequestParams = {}) =>
      this.request<UploadImageData, any>({
        path: `/upload/public/image`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),
  };
  userProfile = {
    /**
     * No description
     *
     * @tags user-profile
     * @name Me
     * @summary Get user data
     * @request GET:/user-profile/user/me
     * @secure
     */
    me: (query: MeParams, params: RequestParams = {}) =>
      this.request<MeData, any>({
        path: `/user-profile/user/me`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-profile
     * @name ChangeLanguage
     * @summary Change Language
     * @request POST:/user-profile/user/change-language
     * @secure
     */
    changeLanguage: (data: ChangeLanguagePayload, params: RequestParams = {}) =>
      this.request<
        ChangeLanguageData,
        {
          message: string;
        }
      >({
        path: `/user-profile/user/change-language`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-profile
     * @name ChangePassword
     * @summary Change password
     * @request POST:/user-profile/user/change-password
     * @secure
     */
    changePassword: (data: ChangePasswordPayload, params: RequestParams = {}) =>
      this.request<ChangePasswordData, any>({
        path: `/user-profile/user/change-password`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-profile
     * @name SaveToken
     * @summary Save Device Token
     * @request POST:/user-profile/user/device-token/save-token
     * @secure
     */
    saveToken: (data: SaveTokenPayload, params: RequestParams = {}) =>
      this.request<
        SaveTokenData,
        {
          message: string;
        }
      >({
        path: `/user-profile/user/device-token/save-token`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-profile
     * @name GetUserDevices
     * @summary Get all user devices
     * @request GET:/user-profile/user/devices
     * @secure
     */
    getUserDevices: (params: RequestParams = {}) =>
      this.request<GetUserDevicesData, any>({
        path: `/user-profile/user/devices`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-profile
     * @name DeleteDeviceSession
     * @summary Delete a specific device session
     * @request DELETE:/user-profile/user/devices/{id}
     * @secure
     */
    deleteDeviceSession: (
      { id, ...query }: DeleteDeviceSessionParams,
      params: RequestParams = {},
    ) =>
      this.request<DeleteDeviceSessionData, any>({
        path: `/user-profile/user/devices/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-profile
     * @name Logout
     * @summary Get user data
     * @request GET:/user-profile/user/logout
     * @secure
     */
    logout: (params: RequestParams = {}) =>
      this.request<LogoutData, any>({
        path: `/user-profile/user/logout`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-profile
     * @name LogoutFromAllDevices
     * @summary Logout from all other devices
     * @request GET:/user-profile/user/logout-from-all-other-devices
     * @secure
     */
    logoutFromAllDevices: (params: RequestParams = {}) =>
      this.request<LogoutFromAllDevicesData, any>({
        path: `/user-profile/user/logout-from-all-other-devices`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-profile
     * @name GetNotificationPreferences
     * @summary Get user notification preferences
     * @request GET:/user-profile/user/notification-preferences
     * @secure
     */
    getNotificationPreferences: (params: RequestParams = {}) =>
      this.request<GetNotificationPreferencesData, any>({
        path: `/user-profile/user/notification-preferences`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-profile
     * @name UpdateNotificationPreferences
     * @summary Update user notification preferences
     * @request PUT:/user-profile/user/notification-preferences/bulk
     * @secure
     */
    updateNotificationPreferences: (
      data: UpdateNotificationPreferencesPayload,
      params: RequestParams = {},
    ) =>
      this.request<UpdateNotificationPreferencesData, any>({
        path: `/user-profile/user/notification-preferences/bulk`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-profile
     * @name Disable2Fa
     * @summary Disable 2FA for user
     * @request POST:/user-profile/user/tow-fa/disable
     * @secure
     */
    disable2Fa: (data: Disable2FaPayload, params: RequestParams = {}) =>
      this.request<Disable2FaData, any>({
        path: `/user-profile/user/tow-fa/disable`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-profile
     * @name Setup2Fa
     * @summary Setup 2FA for user
     * @request POST:/user-profile/user/tow-fa/setup
     * @secure
     */
    setup2Fa: (data: Setup2FaPayload, params: RequestParams = {}) =>
      this.request<Setup2FaData, any>({
        path: `/user-profile/user/tow-fa/setup`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-profile
     * @name Toggle2Fa
     * @summary Toggle 2FA for user (Admin)
     * @request POST:/user-profile/user/tow-fa/toggle
     * @secure
     */
    toggle2Fa: (params: RequestParams = {}) =>
      this.request<Toggle2FaData, any>({
        path: `/user-profile/user/tow-fa/toggle`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags user-profile
     * @name Verify2Fa
     * @summary Verify and enable 2FA for user
     * @request POST:/user-profile/user/tow-fa/verify
     * @secure
     */
    verify2Fa: (data: Verify2FaPayload, params: RequestParams = {}) =>
      this.request<Verify2FaData, any>({
        path: `/user-profile/user/tow-fa/verify`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
