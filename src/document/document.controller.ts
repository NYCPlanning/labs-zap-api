import { Controller,
  Post,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { CRMWebAPI } from '../_utils/crm-web-api';
const eol = require('eol');

@Controller('document')
export class DocumentController {
  constructor(
    private readonly config: ConfigService,
  ) {}

  /** Uploads a single document
    * The incoming POST request should have form-data with...
    * two body fields:
    *   entityName - name of a CRM entity. Currently only accepts  `dcp_project` or `dcp_communityboarddisposition`.
    *   instanceName - should be the `dcp_name` of an instance of the entity identified by `entityName`
    * and a `file` field assigned a buffer of data representing a single file.
  */
  @Post('/')
  @UseInterceptors(FileInterceptor('file'))
  async index(@UploadedFile() file, @Req() request: Request, @Res() response){
    const {
      body: {
        instanceName,
        entityName
      },
    } = request;

    const headers = {
      MSCRMCallerID: this.config.get('CRM_ADMIN_SERVICE_USER')
    };

    // decode from 7bit
    const decodedFile = decodeURI(file.buffer);
    // normalize line ending in string to CRLF (WINDOWS, DOS)
    const decodedFileCRLF = eol.crlf(decodedFile);
    // encode base64
    const encodedBase64File = Buffer.from(decodedFileCRLF).toString('base64');

    let uploadDocResponse = {};

    if ( entityName === 'dcp_project' ) {
      const [projectRecord] = (await CRMWebAPI.get(`dcp_projects?$select=dcp_projectname,dcp_projectid,dcp_name&$filter=dcp_name eq '${instanceName}'&$top=1`))['value'];

      const projectGUID = projectRecord.dcp_projectid;
      const projectID = projectRecord.dcp_name;
      const folderName = `${projectID}_${projectGUID.replace(/\-/g,'').toUpperCase()}`;

      uploadDocResponse = await CRMWebAPI.uploadDocument('dcp_project', projectGUID, folderName, file.originalname, encodedBase64File, true, headers);
      response.status(200).send({"message": uploadDocResponse});
    } else if ( entityName === 'dcp_communityboarddisposition' ) {
      const dispositionRecord = (await CRMWebAPI.get(`dcp_communityboarddispositions?$select=dcp_communityboarddispositionid,dcp_name&$filter=dcp_name eq '${instanceName}'&$top=1`))['value'][0];

      const dispositionGUID = dispositionRecord.dcp_communityboarddispositionid;
      const dispositionID = dispositionRecord.dcp_name;
      // Note that some disposition names have multiple trailing whitespace characters.
      // We leave them in because CRM SHOULD* adhere to the convention of dcp_name + dcp_communityboarddispositionid
      // *Should because we still need to more thoroughly verify this.
      const folderName = `${dispositionID}_${dispositionGUID.replace(/\-/g,'').toUpperCase()}`;

      uploadDocResponse = await CRMWebAPI.uploadDocument('dcp_communityboarddisposition', dispositionGUID, folderName, file.originalname, encodedBase64File, true, headers);
      response.status(200).send({"message": uploadDocResponse});
    } else {
      response.status(400).send({ "error": 'You can only upload files to dcp_project and dcp_communityboarddisposition' });
    }
  }
}
