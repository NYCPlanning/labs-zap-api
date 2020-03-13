import { Entity, Column, PrimaryColumn } from 'typeorm';

export const KEYS = [
  'applicantteam',
  'applicants',
  'dcp_name',
  'dcp_applicanttype',
  'dcp_borough',
  'dcp_ceqrnumber',
  'dcp_ceqrtype',
  'dcp_certifiedreferred',
  'dcp_femafloodzonea',
  'dcp_femafloodzonecoastala',
  'dcp_femafloodzoneshadedx',
  'dcp_femafloodzonev',
  'dcp_sisubdivision',
  'dcp_sischoolseat',
  'dcp_projectbrief',
  'dcp_projectname',
  'dcp_publicstatus',
  'dcp_publicstatus_simp',
  'dcp_projectcompleted',
  'dcp_hiddenprojectmetrictarget',
  'dcp_ulurp_nonulurp',
  'dcp_communitydistrict',
  'dcp_communitydistricts',
  'dcp_validatedcommunitydistricts',
  'has_centroid',
  'dcp_bsanumber',
  'dcp_wrpnumber',
  'dcp_lpcnumber',
  'dcp_name',
  'dcp_lastmilestonedate',
  'dcp_nydospermitnumber',
  'bbls',
  'bbl_featurecollection',
  'addresses',
  'keywords',
  'ulurpnumbers',
  'center',
  'lastmilestonedate',
  'video_links',
  'dcp_dcp_project_dcp_projectaction_project',
  'dcp_dcp_project_dcp_projectapplicant_Project',
  'dcp_dcp_project_dcp_projectbbl_project',
  'dcp_dcp_project_dcp_projectmilestone_project',
  'dcp_ulurpnumber',
  'dcp_block',

  // relationships
  'actions',
  'milestones',
  'dispositions',
];

export const ACTION_KEYS = [
  'dcp_action',
  'dcp_name',
  'actioncode',
  'statuscode',
  'statecode',
  'dcp_ulurpnumber',
  'dcp_zoningresolution',
  'dcp_ccresolutionnumber',
];

export const MILESTONE_KEYS = [
  'dcp_milestone',
  'dcp_name',
  'milestonename',
  'dcp_plannedstartdate',
  'dcp_plannedcompletiondate',
  'dcp_actualstartdate',
  'dcp_actualenddate',
  'statuscode',
  'dcp_milestonesequence',
  'dcp_remainingplanneddayscalculated',
  'dcp_remainingplanneddays',
  'dcp_goalduration',
  'dcp_actualdurationasoftoday',
  'display_description',
  'display_name',
  'display_date',
  'display_date2',
  'outcome',
  'milestone_links',
  'is_revised',
];

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
