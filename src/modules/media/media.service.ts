import { UploadApiErrorResponse } from "cloudinary";
import  cloudinaryInstance from "../../config/cloudinary.config";
import { IUploadPdfFailedResult, IUploadPdfOptions, IUploadPdfSuccessResult } from "./media.interface";
import { UploadApiResponse } from "cloudinary";
import { StatusCodes } from 'http-status-codes';


export const uploadPdfBufferToCloudinary = (
    pdfBuffer: Buffer,
    type:string,
    options:IUploadPdfOptions
): Promise<IUploadPdfSuccessResult> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinaryInstance.uploader.upload_stream(
            { 
               ...options
            },
            (error: UploadApiErrorResponse | undefined, cloudinaryResult: UploadApiResponse | undefined) => {
                if (error) {
                    console.log(error);
                    
                    const errorResult: IUploadPdfFailedResult = {
                        message: error.message || `failed to upload ${type} pdf buffer in cloudinary`,
                        statusCode: StatusCodes.BAD_REQUEST
                    };
                    return reject(errorResult);
                }

                if (cloudinaryResult) {
                    const successResult: IUploadPdfSuccessResult = {
                        secure_url: cloudinaryResult.secure_url,
                        public_id: cloudinaryResult.public_id,
                        original_filename: cloudinaryResult.original_filename,
                    };
                    resolve(successResult);
                } else {
                    reject({
                        message: "Cloudinary returned no result",
                        statusCode: StatusCodes.INTERNAL_SERVER_ERROR
                    } as IUploadPdfFailedResult);
                }
            }
        );

        uploadStream.end(pdfBuffer);
    });
};
   