import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('dcp_project')
export class Project {
  @PrimaryColumn()
  dcp_projectid: number;

  @Column()
  milestones: string;

  @Column()
  actions: string;

  @Column()
  dcp_name: string;

  @Column()
  dcp_projectname: string;

  @Column()
  dcp_projectbrief: string;

  @Column()
  dcp_borough: string;

  @Column()
  dcp_communitydistricts: string;

  @Column()
  dcp_ulurp_nonulurp: string;

  @Column()
  dcp_leaddivision: string;

  @Column()
  dcp_ceqrtype: string;

  @Column()
  dcp_ceqrnumber: string;

  @Column()
  dcp_easeis: string;

  @Column()
  dcp_leadagencyforenvreview: string;

  @Column()
  dcp_alterationmapnumber: string;

  @Column()
  dcp_sischoolseat: string;

  @Column()
  dcp_sisubdivision: string;

  @Column()
  dcp_previousactiononsite: string;

  @Column()
  dcp_wrpnumber: string;

  @Column()
  dcp_nydospermitnumber: string;

  @Column()
  dcp_bsanumber: string;

  @Column()
  dcp_lpcnumber: string;

  @Column()
  dcp_decpermitnumber: string;

  @Column()
  dcp_femafloodzonea: string;

  @Column()
  dcp_femafloodzonecoastala: string;

  @Column()
  dcp_femafloodzonev: string;

  @Column()
  dcp_publicstatus_simp: string;

  @Column()
  actiontypes: string;

  @Column()
  dcp_certifiedreferred: string;

  @Column()
  dcp_femafloodzoneshadedx: string;

  @Column()
  applicants: string;

  @Column()
  lastmilestonedate: string;

  @Column()
  total_projects: string;

  @Column()
  has_centroid: string;

  @Column()
  center: string;

  @Column()
  ulurpnumber: string;

  @Column()
  bbl_featurecollection: string;

  @Column()
  video_links: string;
}
