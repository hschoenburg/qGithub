/*
 * Jobs Table
 * access_token
 * qualCode default null
 * job_status - pending/completed
 * realUser - default null
 * fossScore - default null
 *
 * Web server inserts "pending" jobs with just access_token
 * Task Runner pulls them out, runs the whole process
 * then updates with qualCode, realUser, fossScore, and job_status=complete
 */
