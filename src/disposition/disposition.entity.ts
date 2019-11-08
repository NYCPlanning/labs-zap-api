import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('dcp_communityboarddisposition')
export class Disposition {
  @PrimaryColumn({ name: 'dcp_communityboarddispositionid' })
  id: string;

  @Column()
  dcp_publichearinglocation: string;

  @Column()
  dcp_dateofpublichearing: string;

  @Column()
  dcp_ispublichearingrequired: string;

  @Column()
  dcp_recommendationsubmittedbyname: string;

  @Column()
  form_completer_name: string;

  @Column()
  form_completer_title: string;

  @Column()
  dcp_boroughpresidentrecommendation: string;

  @Column()
  dcp_boroughboardrecommendation: string;

  @Column()
  dcp_communityboardrecommendation: string;

  @Column()
  dcp_consideration: string;

  @Column()
  dcp_votelocation: string;

  @Column()
  dcp_datereceived: string;

  @Column()
  dcp_dateofvote: string;

  @Column()
  statecode: string;

  @Column()
  statuscode: string;

  @Column()
  dcp_docketdescription: string;

  @Column()
  dcp_votinginfavorrecommendation: string;

  @Column()
  dcp_votingagainstrecommendation: string;

  @Column()
  dcp_votingabstainingonrecommendation: string;

  @Column()
  dcp_totalmembersappointedtotheboard: string;

  @Column()
  dcp_wasaquorumpresent: string;
}
