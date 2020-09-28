/*******************************************************************
EXEC [dbo].[TelemetrySummary_Daywise_Add]	
	
001	SAQM-1 08-04-2020 [Nishit Khakhi]	Added Initial Version to Add Telemetry Summary Day wise for Day
*******************************************************************/
CREATE PROCEDURE [dbo].[TelemetrySummary_Daywise_Add]
AS
BEGIN
	SET NOCOUNT ON
	
	BEGIN TRY
	DECLARE @dt DATETIME = GETUTCDATE(), @lastExecDate DATETIME
	SELECT 
		TOP 1 @lastExecDate = CONVERT(DATETIME,[value]) 
	FROM [dbo].[Configuration] 
	WHERE [configKey] = 'telemetry-last-exectime' AND [isDeleted] = 0

	BEGIN TRAN		
		DELETE FROM [dbo].[TelemetrySummary_Daywise] WHERE (CONVERT(DATE,[date]) BETWEEN CONVERT(DATE,@lastExecDate) AND CONVERT(DATE,@dt)) 
		
		INSERT INTO [dbo].[TelemetrySummary_Daywise]([guid]
		,[deviceGuid]
		,[date]
		,[attribute]
		,[min]
		,[max]
		,[avg]
		,[latest]
		,[sum]
		)
		
		SELECT NEWID(), [guid], [Date], [localName], 0, 0, 0, 0, ValueCount
		FROM (
		
		select D.[guid],KA.[code] AS localName, CONVERT(DATE,A.createdDate) [Date], SUM(ROUND(CONVERT(DECIMAL(18,7),REPLACE(attributevalue,',','')),2)) ValueCount
		FROM [IOTConnect].[AttributeValue] A
		INNER JOIN [dbo].[KitTypeAttribute] KA ON A.[localName] = KA.[localName]
		INNER JOIN [dbo].[Device] D ON A.[uniqueId] = D.[uniqueId] AND D.[isDeleted] = 0
		WHERE (CONVERT(DATE,A.[createdDate]) BETWEEN CONVERT(DATE,@lastExecDate) AND CONVERT(DATE,@dt)) AND A.localName IN ('currentin','voltage')
		GROUP BY D.[guid],KA.[code] , CONVERT(DATE,A.createdDate)
		) A
				
		UPDATE C 
		SET [value] = convert(nvarchar(50),@dt,121)
		FROM [dbo].[Configuration] C 
		WHERE [configKey] = 'telemetry-last-exectime' AND [isDeleted] = 0

	COMMIT TRAN	

	END TRY	
	BEGIN CATCH
	DECLARE @errorReturnMessage nvarchar(MAX)

	SELECT
		@errorReturnMessage = ISNULL(@errorReturnMessage, ' ') + SPACE(1) +
		'ErrorNumber:' + ISNULL(CAST(ERROR_NUMBER() AS nvarchar), ' ') +
		'ErrorSeverity:' + ISNULL(CAST(ERROR_SEVERITY() AS nvarchar), ' ') +
		'ErrorState:' + ISNULL(CAST(ERROR_STATE() AS nvarchar), ' ') +
		'ErrorLine:' + ISNULL(CAST(ERROR_LINE() AS nvarchar), ' ') +
		'ErrorProcedure:' + ISNULL(CAST(ERROR_PROCEDURE() AS nvarchar), ' ') +
		'ErrorMessage:' + ISNULL(CAST(ERROR_MESSAGE() AS nvarchar(MAX)), ' ')

	RAISERROR (@errorReturnMessage
	, 11
	, 1
	)

	IF (XACT_STATE()) = -1 BEGIN
		ROLLBACK TRANSACTION
	END
	IF (XACT_STATE()) = 1 BEGIN
		ROLLBACK TRANSACTION
	END
	END CATCH
END

