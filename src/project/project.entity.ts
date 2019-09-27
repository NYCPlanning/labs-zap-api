import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('dcp_project')
export class Project {
  @PrimaryColumn({ name: 'dcp_projectid' })
  projectid: number;

  @Column()
  milestones: string;

  @Column()
  actions: string;

  @Column({ name: 'dcp_name' })
  name: string;

  @Column({ name: 'dcp_projectname' })
  projectname: string;

  @Column({ name: 'dcp_projectbrief' })
  projectbrief: string;

  @Column({ name: 'dcp_borough' })
  borough: string;

  @Column({ name: 'dcp_communitydistricts' })
  communitydistricts: string;

  @Column({ name: 'dcp_ulurp_nonulurp' })
  ulurp_nonulurp: string;

  @Column({ name: 'dcp_leaddivision' })
  leaddivision: string;

  @Column({ name: 'dcp_ceqrtype' })
  ceqrtype: string;

  @Column({ name: 'dcp_ceqrnumber' })
  ceqrnumber: string;

  @Column({ name: 'dcp_easeis' })
  easeis: string;

  @Column({ name: 'dcp_leadagencyforenvreview' })
  leadagencyforenvreview: string;

  @Column({ name: 'dcp_alterationmapnumber' })
  alterationmapnumber: string;

  @Column({ name: 'dcp_sischoolseat' })
  sischoolseat: string;

  @Column({ name: 'dcp_sisubdivision' })
  sisubdivision: string;

  @Column({ name: 'dcp_previousactiononsite' })
  previousactiononsite: string;

  @Column({ name: 'dcp_wrpnumber' })
  wrpnumber: string;

  @Column({ name: 'dcp_nydospermitnumber' })
  nydospermitnumber: string;

  @Column({ name: 'dcp_bsanumber' })
  bsanumber: string;

  @Column({ name: 'dcp_lpcnumber' })
  lpcnumber: string;

  @Column({ name: 'dcp_decpermitnumber' })
  decpermitnumber: string;

  @Column({ name: 'dcp_femafloodzonea' })
  femafloodzonea: string;

  @Column({ name: 'dcp_femafloodzonecoastala' })
  femafloodzonecoastala: string;

  @Column({ name: 'dcp_femafloodzonev' })
  femafloodzonev: string;

  @Column({ name: 'dcp_publicstatus_simp' })
  publicstatus_simp: string;

  @Column()
  actiontypes: string;

  @Column({ name: 'dcp_certifiedreferred' })
  certifiedreferred: string;

  @Column({ name: 'dcp_femafloodzoneshadedx' })
  femafloodzoneshadedx: string;

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
